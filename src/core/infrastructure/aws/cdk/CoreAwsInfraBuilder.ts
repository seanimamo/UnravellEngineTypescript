import { InfraResourceIdBuilder, Stage } from "../..";
import { EmailStack, SingleDomainDnsStack, SubdomainDnsStack } from "..";
import * as cdk from "aws-cdk-lib";
import { DynamoDBStack, IDatabaseTableData } from "./database";
import { CognitoStack } from "./users";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { PublicServerlessApiStack } from "./api";
import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ses from "aws-cdk-lib/aws-ses";
import { CustomNodeJsLambdaConfig } from ".";

export interface SharedGlobalInfraConfig {
  dns: {
    /**
     * The base domain used in all of your apps domains.
     * For example myApp.com
     */
    appBaseDomain: string;
    /**
     * DNS infrastructure has no region because it is global in AWS. However, the CDK stack that deploys these
     * DNS resources will still live in a specific region which is what this variable controls.
     */
    stackRegion: string;
  };
}

export interface CreateDatabaseInfraConfig {
  databaseType: "dynamodb";
  region: string;
  tables: {
    user: {
      tableName: string;
    };
    stripeSubscription?: {
      tableName: string;
    };
  };
}

export interface CreateUserAuthInfraProps {
  cognito: {
    region: string;
    frontEndVerifyAccountCodeURL: string;
    frontEndPasswordResetCodeURL: string;
    preSignupLambdaTriggerConfig: CustomNodeJsLambdaConfig;
    postConfirmationLambdaTriggerConfig: CustomNodeJsLambdaConfig;
    /**
     * The configuration for setting up the Cognito custom email sender lambda.
     * This allows us to customize the automatic emails from cognito.
     */
    mailingLogic: {
      method: "custom" | "cognito";
      customEmailLambdaTrigger: CustomNodeJsLambdaConfig;
    };
  };
}

export interface CreateEmailInfraProps {
  domainHostedZone: route53.HostedZone;
}

export interface CreateApiInfraProps {
  publicApi: {
    region: string;
    lambdaApiEndpointConfig: {
      getUserByUserId: CustomNodeJsLambdaConfig;
    };
  };
}

export class CoreAwsInfraBuilder {
  /**
   * Initializes AWS CDK application
   */
  private readonly cdkApp = new cdk.App();

  public readonly appName: string;
  public readonly awsAccountId: string;

  constructor(appName: string, awsAccountId: string) {
    this.appName = appName;
    this.awsAccountId = awsAccountId;
  }

  buildAppInfra(config: {
    sharedGlobalInfra: SharedGlobalInfraConfig;
    stageInfra: {
      stage: Stage;
      database: CreateDatabaseInfraConfig;
      userAuth: CreateUserAuthInfraProps;
      email: {
        region: string;
      };
      api: CreateApiInfraProps;
    };
  }) {
    const sharedGlobalInfra = this.composeSharedGlobalInfra(
      config.sharedGlobalInfra
    );

    this.composeStageRegionInfra(config.stageInfra.stage, {
      sharedGlobalInfra: {
        dns: {
          parentDomainHostedZone: sharedGlobalInfra.dns.parentDomainHostedZone,
          region: config.sharedGlobalInfra.dns.stackRegion,
        },
      },
      database: config.stageInfra.database,
      userAuth: config.stageInfra.userAuth,
      email: {
        region: config.stageInfra.email.region,
      },
      api: config.stageInfra.api,
    });
  }

  composeSharedGlobalInfra(config: SharedGlobalInfraConfig) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      Stage.PROD
    );

    // Creates the root DNS infrastructure for your app, necessary for enabling <yourDomain>.com to work.
    const route53StackName = infraResourceIdBuilder.stageBasedId(
      "Shared-Route53Stack"
    );
    const parentDomainDnsInfra = new SingleDomainDnsStack(
      this.cdkApp,
      route53StackName,
      {
        stackName: route53StackName,
        env: {
          account: this.awsAccountId,
          region: config.dns.stackRegion,
        },
      },
      {
        idBuilder: infraResourceIdBuilder,
        appDomain: config.dns.appBaseDomain,
      }
    );

    return {
      dns: {
        parentDomainHostedZone: parentDomainDnsInfra.domainHostedZone,
      },
    };
  }

  composeStageRegionInfra(
    stage: Stage,
    config: {
      sharedGlobalInfra: {
        dns: {
          parentDomainHostedZone: route53.HostedZone;
          region: string;
        };
      };
      database: CreateDatabaseInfraConfig;
      userAuth: CreateUserAuthInfraProps;
      email: {
        region: string;
      };
      api: CreateApiInfraProps;
    }
  ) {
    const databaseInfra = this.createDatabaseInfra(stage, config.database);

    let emailInfra;
    let domainHostedZone: route53.HostedZone;
    // In production we want emails to come from our base domain e.g. no-reply@myApp.com, in non prod we instead the one suffixed
    // with stages such as no-reply@prod.myApp.com.
    // It's important to create unique email identity for non prod stages so we don't ruin our email reputation stats with tests.
    if (stage === Stage.PROD) {
      emailInfra = this.createEmailInfra(stage, config.email.region, {
        domainHostedZone: config.sharedGlobalInfra.dns.parentDomainHostedZone,
      });
      domainHostedZone = config.sharedGlobalInfra.dns.parentDomainHostedZone;
    } else {
      const subdomainDnsInfra = this.createSubDomainInfra(stage, {
        hostedZone: config.sharedGlobalInfra.dns.parentDomainHostedZone,
        region: config.sharedGlobalInfra.dns.region,
      });

      domainHostedZone = subdomainDnsInfra.hostedZone;

      emailInfra = this.createEmailInfra(stage, config.email.region, {
        domainHostedZone: domainHostedZone,
      });
    }

    const userAuthInfra = this.createUserAuthInfra(
      stage,
      {
        emailInfra: {
          sesIdentity: emailInfra.domainSesIdentity,
          emailAddress: `no-reply@${domainHostedZone.zoneName}`,
        },
        databaseStack: databaseInfra,
      },
      config.userAuth
    );

    const publicApiInfra = this.createPublicApiInfra(
      stage,
      config.api.publicApi.region,
      {
        dependantInfra: {
          domainHostedZone: domainHostedZone,
          cognitoUserPool: userAuthInfra.cognitoStack.userPool,
          userDatabaseTableData: databaseInfra.userTableData,
        },
        apiConfig: config.api,
      }
    );

    return {
      databaseInfra: databaseInfra,
      emailInfra: emailInfra,
      userAuthInfra: userAuthInfra,
      publicApiInfra,
    };
  }

  /**
   * Creates infrastructure stack for a subdomain.
   */
  createSubDomainInfra(
    stage: Stage,
    parentDomainInfra: {
      hostedZone: route53.HostedZone;
      region: string;
    }
  ) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );
    const route53StackName =
      infraResourceIdBuilder.stageBasedId("Route53Stack");

    const subdomainName = `${stage.toString().toLowerCase()}.${
      parentDomainInfra.hostedZone.zoneName
    }`;

    const route53Stack = new SubdomainDnsStack(
      this.cdkApp,
      route53StackName,
      {
        stackName: route53StackName,
        env: {
          account: this.awsAccountId,
          region: parentDomainInfra.region,
        },
        terminationProtection: true,
      },
      {
        idBuilder: infraResourceIdBuilder,
        parentDomainHostedZone: parentDomainInfra.hostedZone,
        subDomainName: subdomainName,
      }
    );

    return {
      hostedZone: route53Stack.subDomainHostedZone,
    };
  }

  createDatabaseInfra(stage: Stage, props: CreateDatabaseInfraConfig) {
    if (props.databaseType === "dynamodb") {
      const infraResourceIdBuilder = new InfraResourceIdBuilder(
        this.appName,
        stage
      );
      const dynamoDbStackName =
        infraResourceIdBuilder.stageBasedId("DynamoDBStack");
      const dynamoDbStack = new DynamoDBStack(this.cdkApp, dynamoDbStackName, {
        stackName: dynamoDbStackName,
        env: {
          region: props.region,
          account: this.awsAccountId,
        },
        terminationProtection: true,
        stage: stage,
        idBuilder: infraResourceIdBuilder,
        tableProps: {
          user: props.tables.user,
          stripeSubscriptionCache: props.tables.stripeSubscription,
        },
      });

      return dynamoDbStack;
    } else {
      throw new Error("Only dynamodb is supported as a database at this time.");
    }
  }

  createEmailInfra(stage: Stage, region: string, props: CreateEmailInfraProps) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );
    const sesStackName = infraResourceIdBuilder.stageBasedId("SesStack");
    const sesStack = new EmailStack(
      this.cdkApp,
      sesStackName,
      {
        stackName: sesStackName,
        env: {
          account: this.awsAccountId,
          region: region,
        },
        terminationProtection: true,
      },
      {
        idBuilder: infraResourceIdBuilder,
        emailDomainHostedZone: props.domainHostedZone,
      }
    );

    return sesStack;
  }

  createUserAuthInfra(
    stage: Stage,
    /**
     * Infrastructure stacks User Auth infrastructure is dependant on
     */
    dependantInfra: {
      databaseStack: DynamoDBStack;
      emailInfra: {
        sesIdentity: ses.EmailIdentity;
        emailAddress: string;
      };
    },
    props: CreateUserAuthInfraProps
  ) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );

    const {
      frontEndVerifyAccountCodeURL,
      frontEndPasswordResetCodeURL,
      preSignupLambdaTriggerConfig,
      postConfirmationLambdaTriggerConfig,
      mailingLogic,
    } = props.cognito;

    const cognitoStackName =
      infraResourceIdBuilder.stageBasedId("CognitoStack");
    const cognitoStack = new CognitoStack(
      this.cdkApp,
      cognitoStackName,
      {
        stackName: cognitoStackName,
        env: {
          region: props.cognito.region,
          account: this.awsAccountId,
        },
        terminationProtection: true,
        crossRegionReferences: true,
      },
      {
        stage: stage,
        idBuilder: infraResourceIdBuilder,
        userDbTable: dependantInfra.databaseStack.userTableData,
        appDisplayName: this.appName,
        frontEndVerifyAccountCodeURL,
        frontEndPasswordResetCodeURL,
        emailInfra: dependantInfra.emailInfra,
        preSignupLambdaTriggerConfig,
        postConfirmationLambdaTriggerConfig,
        mailingLogic,
      }
    );

    return {
      cognitoStack: cognitoStack,
    };
  }

  createPublicApiInfra(
    stage: Stage,
    region: string,
    props: {
      dependantInfra: {
        domainHostedZone: route53.HostedZone;
        cognitoUserPool: IUserPool;
        userDatabaseTableData: IDatabaseTableData;
      };
      apiConfig: CreateApiInfraProps;
    }
  ) {
    const { dependantInfra, apiConfig } = props;

    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );
    const publicApiStackName = infraResourceIdBuilder.stageBasedId("PublicApi");

    return new PublicServerlessApiStack(this.cdkApp, publicApiStackName, {
      stackName: publicApiStackName,
      env: {
        account: this.awsAccountId,
        region: region,
      },
      terminationProtection: true,
      crossRegionReferences: true,
      appDisplayName: this.appName,
      idBuilder: infraResourceIdBuilder,
      apiDomainName: dependantInfra.domainHostedZone.zoneName,
      cognitoUserPool: dependantInfra.cognitoUserPool,
      userDatabaseTableData: dependantInfra.userDatabaseTableData,
      lambdaApiEndpointConfig: apiConfig.publicApi.lambdaApiEndpointConfig,
    });
  }
}
