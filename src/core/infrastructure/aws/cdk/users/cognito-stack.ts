import { Stack, StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  CfnUserPool,
  CfnUserPoolClient,
  Mfa,
  StringAttribute,
  UserPool,
  UserPoolOperation,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { Stage } from "../../../common/Stage";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";
import { DynamoTableData } from "../database/dynamodb-stack";
import * as ses from "aws-cdk-lib/aws-ses";

// TODO: Update this stack to allow more than one type of database.
type CognitoStackProps = {
  /**
   * The infrastructure stage this DynamoDB Stack is a part of e.g. Beta, Prod.
   */
  stage: Stage;
  /**
   * Utility Tool used for creating consistent id's & names for our AWS resources.
   */
  idBuilder: InfraResourceIdBuilder;
  /**
   * DynamoDB table data necessary to give pre and post signup lambdas database access.
   */
  userDynamoDbTable: DynamoTableData;
  /**
   * The display name of your application, for example, "NoteTaker", "WeatherChecker", etc.
   */
  appDisplayName: string;
  /**
   * The URL of your applications front end for verifying a login code.
   * It is expected that the end of the url will accept the code as query parameter
   * @example https://www.myApp.com/account/verify/code
   */
  frontEndVerifyAccountCodeURL: string;
  /**
   * This will be necessary so we can automatically send emails using cognito
   * for various auth flows such as password resets from your own url.
   */
  noReplyEmailInfra: {
    sesIdentity: ses.EmailIdentity;
    emailAddress: string;
  };
  /**
   * The configuration for setting up the Cognito Pre Sign-up lambda trigger
   */
  preSignupLambdaTriggerConfig: {
    /**
     * The path to the file containing the lambda function
     */
    entry: string;
    /**
     * The name of the function within the provided file used as the lambda function
     */
    handler: string;
  } & NodejsFunctionProps;
  /**
   * The configuration for setting up the Cognito Post confirmation lambda trigger
   */
  postConfirmationLambdaTriggerConfig: {
    /**
     * The path to the file containing the lambda function
     */
    entry: string;
    /**
     * The name of the function within the provided file used as the lambda function
     */
    handler: string;
  } & NodejsFunctionProps;
} & StackProps;

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  private readonly stage: Stage;

  private idBuilder: InfraResourceIdBuilder;
  private userDynamoDbTable: DynamoTableData;
  private appDisplayName: string;
  private frontEndVerifyAccountCodeURL: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    this.stage = props.stage;
    this.idBuilder = props.idBuilder;
    this.userDynamoDbTable = props.userDynamoDbTable;
    this.appDisplayName = props.appDisplayName;
    this.frontEndVerifyAccountCodeURL = props.frontEndVerifyAccountCodeURL;
    this.userPool = this.createCognitoUserPool(
      props.noReplyEmailInfra.sesIdentity,
      props.noReplyEmailInfra.emailAddress
    );
    this.addUserPoolLambdaTriggers(this.userPool, props);
    this.createUserPoolUIClient(this.userPool);
  }

  createCognitoUserPool(
    noReplySesEmailIdentity: ses.EmailIdentity,
    noReplyEmailAddress: string
  ) {
    const userPoolName = this.idBuilder.createStageBasedId("UserPool");
    const cognitoUserPool = new UserPool(this, userPoolName, {
      userPoolName: userPoolName,
      signInAliases: {
        username: false,
        email: true,
        phone: false,
      },
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireDigits: false,
        requireLowercase: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      enableSmsRole: true,
      autoVerify: {
        email: true,
      },
      userVerification: {
        // The reason we opt to use a code and link to our URL is because AWS cognito's built in verification link url is very unprofessional looking.
        emailStyle: VerificationEmailStyle.CODE,
        emailSubject: `Your ${this.appDisplayName} Account Verification Link`,
        emailBody: `Welcome to ${this.appDisplayName}! Please click this link to verify your account: ${this.frontEndVerifyAccountCodeURL}?code={####}`,
      },
      customAttributes: {
        firstName: new StringAttribute({
          mutable: true,
        }),
        lastName: new StringAttribute({
          mutable: true,
        }),
      },
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false,
      },
      accountRecovery: AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
      mfa: Mfa.OPTIONAL,
    });

    // Unecessary, only needed for the hosted UI.
    // cognitoUserPool.addDomain(
    //     this.idBuilder.createStackId("UserPoolDomain"),
    //     {
    //         cognitoDomain: {
    //             domainPrefix: this.idBuilder
    //                 .createStageId("unravell-email")
    //                 .toLowerCase(),
    //         },
    //     }
    // );

    const cfnUserPool = cognitoUserPool.node.defaultChild as CfnUserPool;

    /**
     * This makes cognitos automatic emails get sent from our own custom app email domain.
     */
    cfnUserPool.emailConfiguration = {
      emailSendingAccount: "DEVELOPER",
      from: noReplyEmailAddress,
      sourceArn: noReplySesEmailIdentity.emailIdentityArn,
    };

    return cognitoUserPool;
  }

  /**
   * Creates User Pool Client
   */
  createUserPoolUIClient(cognitoUserPool: UserPool) {
    const userPoolId = this.idBuilder.createStageBasedId("UserPoolClient");
    cognitoUserPool.addClient(userPoolId, {
      userPoolClientName: userPoolId,
      // We would only want a secret if were NOT using a UI to access this user pool.
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
        userPassword: true,
        custom: true,
      },
      preventUserExistenceErrors: true,
    });
  }

  // TODO: Abstract this
  addUserPoolLambdaTriggers(
    cognitoUserPool: UserPool,
    props: CognitoStackProps
  ) {
    const { preSignupLambdaTriggerConfig } = props;

    const preSignUpLambdaTrigger = new NodejsFunction(
      this,
      this.idBuilder.createStageBasedId("CognitoPreSignUp"),
      {
        functionName: this.idBuilder.createStageBasedId("CognitoPreSignUp"),
        runtime: Runtime.NODEJS_16_X,
        entry: preSignupLambdaTriggerConfig.entry,
        handler: preSignupLambdaTriggerConfig.handler,
        architecture:
          preSignupLambdaTriggerConfig.architecture ?? Architecture.ARM_64,
        memorySize: preSignupLambdaTriggerConfig.memorySize ?? 1024, // This memory amount is overkill but will minimize cold start time
        environment: {
          STAGE: props.stage,
          ...preSignupLambdaTriggerConfig.environment,
        },
        initialPolicy: [
          this.createDynamoAllowPolicyForAllIndexes(
            ["dynamodb:PutItem", "dynamodb:Query"],
            props
          ),
          ...(preSignupLambdaTriggerConfig.initialPolicy ?? []),
        ],
        bundling: {
          minify: true,
          externalModules: [
            "@aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
          ],
          esbuildArgs: {
            // Pass additional arguments to esbuild
            "--analyze": true,
          },
          ...preSignupLambdaTriggerConfig.bundling,
        },
      }
    );
    cognitoUserPool.addTrigger(
      UserPoolOperation.PRE_SIGN_UP,
      preSignUpLambdaTrigger
    );

    const { postConfirmationLambdaTriggerConfig } = props;

    const postConfirmationLambdaTrigger = new NodejsFunction(
      this,
      this.idBuilder.createStageBasedId("CognitoPostConfirmation"),
      {
        functionName: this.idBuilder.createStageBasedId(
          "CognitoPostConfirmation"
        ),
        runtime: Runtime.NODEJS_16_X,
        entry: postConfirmationLambdaTriggerConfig.entry,
        handler: postConfirmationLambdaTriggerConfig.handler,
        architecture:
          postConfirmationLambdaTriggerConfig.architecture ??
          Architecture.ARM_64,
        memorySize: postConfirmationLambdaTriggerConfig.memorySize ?? 1024, // This memory amount is overkill but will minimize cold start time
        environment: {
          STAGE: props.stage,
          ...postConfirmationLambdaTriggerConfig.environment,
        },
        initialPolicy: [
          this.createDynamoAllowPolicyForAllIndexes(
            ["dynamodb:UpdateItem", "dynamodb:Query"],
            props
          ),
          ...(postConfirmationLambdaTriggerConfig.initialPolicy ?? []),
        ],
        bundling: {
          minify: true,
          externalModules: [
            "@aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
          ],
          esbuildArgs: {
            // Pass additional arguments to esbuild
            "--analyze": true,
          },
          ...postConfirmationLambdaTriggerConfig.bundling,
        },
      }
    );
    cognitoUserPool.addTrigger(
      UserPoolOperation.POST_CONFIRMATION,
      postConfirmationLambdaTrigger
    );
  }

  private createDynamoAllowPolicyForAllIndexes(
    actions: string[],
    props: CognitoStackProps
  ) {
    return new PolicyStatement({
      actions,
      effect: Effect.ALLOW,
      resources: [
        props.userDynamoDbTable.table.tableArn,
        ...props.userDynamoDbTable.globalSecondaryIndexes.map(
          (index) => index.arn
        ),
      ],
    });
  }
}
