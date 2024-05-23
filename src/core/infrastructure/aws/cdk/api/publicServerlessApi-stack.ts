import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfraResourceIdBuilder, Stage } from "../../../common";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as certificateManager from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { ApiGatewayDomain } from "aws-cdk-lib/aws-route53-targets";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { DynamoTableData } from "../database/dynamodb-stack";
import { IDatabaseTableData } from "../database";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface PublicServerlessApiStackProps extends StackProps {
  /**
   * The display name of your application, for example, "NoteTaker", "WeatherChecker", etc.
   */
  appDisplayName: string;
  /**
   * Utility Tool used for creating consistent id's & names for our AWS resources.
   */
  idBuilder: InfraResourceIdBuilder;
  apiDomainName: string;
  /**
   * The cognito user pool to be used as an authentication token source for protected public api endpoints
   */
  cognitoUserPool: IUserPool;
  /**
   * Information set for the user database table. This is necessary to give our AWS Lambda functions api endpoints
   * sufficient permission to access our user database table.
   */
  userDatabaseTableData: IDatabaseTableData;
  /**
   * Code paths for your AWS Lambda functions used as API Gateway endpoints.
   */
  lambdaApiEndpointConfig: {
    getUserByUserId: {
      /**
       * The path to the file containing the lambda function
       */
      entry: string;
      /**
       * The name of the function within the provided file used as the lambda function
       */
      handler: string;
    } & NodejsFunctionProps;
  };
}

export class PublicServerlessApiStack extends Stack {
  /**
   * A utility for creating consistent resource names in AWS.
   */
  private readonly idBuilder: InfraResourceIdBuilder;

  constructor(
    scope: Construct,
    id: string,
    props: PublicServerlessApiStackProps
  ) {
    super(scope, id, props);

    const restApiName = this.idBuilder.createStageBasedId(props.appDisplayName);
    const restApi = new apiGateway.RestApi(this, restApiName, {
      restApiName: restApiName,
    });

    this.createDnsInfrastructure(restApi, props.apiDomainName);

    restApi.addGatewayResponse("UnauthorizedResponse", {
      type: apiGateway.ResponseType.UNAUTHORIZED,
      statusCode: "401",
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    });

    // This authorizer can be used on an endpoint to automatically authorize incoming request tokens against one or more given cognito user pool
    const cognitoAuthorizer = new apiGateway.CognitoUserPoolsAuthorizer(
      this,
      id,
      {
        authorizerName: id,
        identitySource: "method.request.header.Authorization",
        cognitoUserPools: [props.cognitoUserPool],
      }
    );

    this.addUserEndpoints(
      restApi,
      cognitoAuthorizer,
      props.lambdaApiEndpointConfig,
      props.userDatabaseTableData
    );
  }

  private createDnsInfrastructure(
    restApi: apiGateway.RestApi,
    apiDomainName: string
  ) {
    const apiDomainHostedZone = new route53.HostedZone(
      this,
      `${apiDomainName}-HostedZone`,
      {
        zoneName: apiDomainName,
      }
    );

    const apiDomainNameCertificateId = this.idBuilder.createStageBasedId(
      `${apiDomainName}-certificate`
    );

    const apiDomainCertificate = new certificateManager.Certificate(
      this,
      apiDomainNameCertificateId,
      {
        domainName: apiDomainName,
        validation:
          certificateManager.CertificateValidation.fromDns(apiDomainHostedZone),
      }
    );

    restApi.addDomainName("ApiDomainName", {
      certificate: apiDomainCertificate,
      domainName: apiDomainName,
    });

    // Adds an alaias record that routes traffic going to the domain to the rest api.
    new route53.ARecord(this, "ApiCustomDomainARecord", {
      zone: apiDomainHostedZone,
      comment:
        "Alias record that routes traffic going to this domain to the api",
      recordName: `${apiDomainName}.`, // You need the . at the end of the domain name here
      target: route53.RecordTarget.fromAlias(
        new ApiGatewayDomain(restApi.domainName!)
      ),
    });
  }

  private addUserEndpoints(
    restApi: apiGateway.RestApi,
    cognitoAuthorizor: apiGateway.CognitoUserPoolsAuthorizer,
    lambdaApiEndpointConfig: {
      getUserByUserId: {
        /**
         * The path to the file containing the lambda function
         */
        entry: string;
        /**
         * The name of the function within the provided file used as the lambda function
         */
        handler: string;
      } & NodejsFunctionProps;
    },
    databaseTableData: IDatabaseTableData
  ) {
    // ------------------ GET /user/{userId} (get user by userId) ------------------
    const userUserIdResource = restApi.root
      .addResource("users")
      .addResource("{userId}");
    this.addOptionsMethodWithCorsHeaders(userUserIdResource);

    const apiLambdaId = this.idBuilder.createStageBasedId(
      "GetUserByUsernameLambda"
    );

    const getUserByUsernameIamPermissions: PolicyStatement[] = [];
    if (databaseTableData.databaseType === "dynamodb") {
      getUserByUsernameIamPermissions.push(
        this.createDynamoAllowPolicyForAllDynamoIndexes(
          ["dynamodb:Query", "dynamodb:PutItem"],
          databaseTableData as DynamoTableData
        )
      );
    }

    const getUserByUsername = new NodejsFunction(this, apiLambdaId, {
      functionName: apiLambdaId,
      entry: path.join(
        __dirname,
        lambdaApiEndpointConfig.getUserByUserId.entry
      ),
      handler: lambdaApiEndpointConfig.getUserByUserId.handler,
      initialPolicy: getUserByUsernameIamPermissions,
      ...this.getApiLambdaProps(lambdaApiEndpointConfig.getUserByUserId),
    });
    userUserIdResource.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(getUserByUsername),
      {
        authorizationType: apiGateway.AuthorizationType.COGNITO,
        authorizer: cognitoAuthorizor,
      }
    );
    // ------------------------------------------------------------------------
  }

  /**
   * Utility method for getting basic configuration for an API Gateway lambda proxy.
   */
  private getApiLambdaProps(overrides: NodejsFunctionProps) {
    return {
      runtime: overrides.runtime ?? Runtime.NODEJS_16_X,
      architecture: overrides.architecture ?? Architecture.ARM_64,
      memorySize: overrides.memorySize ?? 1024,
      timeout: overrides.timeout ?? Duration.seconds(10),
      environment: {
        ...overrides.environment,
      },
      bundling: {
        minify: true,
        externalModules: [
          "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
        esbuildArgs: {
          // Pass additional arguments to esbuild
          // "--analyze": true,
        },
        ...overrides.bundling,
      },
    };
  }

  /**
   * Utility method for creating an IAM policy that allows a set of actions across all indexes on a Dynamodb table.
   * @remarks - As your application gets more mature you should start to tighten down to giving access to only the indexes you need.
   */
  private createDynamoAllowPolicyForAllDynamoIndexes(
    allowActions: string[],
    dynamoTableData: DynamoTableData
  ) {
    return new PolicyStatement({
      actions: allowActions,
      effect: Effect.ALLOW,
      resources: dynamoTableData.globalSecondaryIndexes.map((gsi) => gsi.arn),
    });
  }

  /**
   * Utility method for adding an OPTIONS endpoint to REST API resources.
   * This enables your API Gateway to accept and return a successful response to OPTIONS requests without any extra infrastructure.
   * This OPTIONS request also includes a non restrictive CORS header response.
   *
   * @remarks You may want to adjust the CORS header here if you know exactly what domains will be hitting your API for extra security.
   * @remarks Browsers will often automatically make a preliminary OPTIONS request to endpoints before making the actual request in order to confirm what "options" an api endpoint exposes.
   */
  private addOptionsMethodWithCorsHeaders(resource: apiGateway.IResource) {
    const methodIntegration = new apiGateway.MockIntegration({
      passthroughBehavior: apiGateway.PassthroughBehavior.NEVER,
      integrationResponses: [
        {
          responseParameters: {
            ["method.response.header.Access-Control-Allow-Headers"]:
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            ["method.response.header.Access-Control-Allow-Origin"]: "'*'",
            ["method.response.header.Access-Control-Allow-Credentials"]:
              "'false'",
            ["method.response.header.Access-Control-Allow-Methods"]:
              "'OPTIONS,GET,PUT,POST,DELETE,PATCH'",
          },
          statusCode: "200",
        },
      ],
      requestTemplates: { ["application/json"]: '{"statusCode": 200}' },
    });

    const methodOptions = {
      methodResponses: [
        {
          responseParameters: {
            ["method.response.header.Access-Control-Allow-Headers"]: true,
            ["method.response.header.Access-Control-Allow-Methods"]: true,
            ["method.response.header.Access-Control-Allow-Credentials"]: true,
            ["method.response.header.Access-Control-Allow-Origin"]: true,
          },
          statusCode: "200",
        },
      ],
    };

    resource.addMethod("OPTIONS", methodIntegration, methodOptions);
  }
}
