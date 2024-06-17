import { InfraResourceIdBuilder, Stage } from "../..";
import { SesStack, SimpleDnsStack } from "..";
import * as cdk from "aws-cdk-lib";
import { DynamoDBStack, IDatabaseTableData } from "./database";
import { CognitoStack } from "./users";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { PublicServerlessApiStack } from "./api";
import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";

export interface SharedGlobalInfraConfig {
  dns: {
    /**
     * The base domain used in all of your apps domains.
     * For example myApp.com
     */
    appBaseDomain: string;
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
  };
}

export interface CreateEmailInfraProps {
  appDomain: string;
}

export interface CreateApiInfraProps {
  publicApi: {
    region: string;
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
    const { sharedGlobalInfra, stageInfra } = config;

    this.composeSharedGlobalInfra(sharedGlobalInfra);

    this.composeStageRegionInfra(stageInfra.stage, {
      sharedGlobalInfra: sharedGlobalInfra,
      database: stageInfra.database,
      userAuth: stageInfra.userAuth,
      email: {
        region: stageInfra.email.region,
      },
      api: stageInfra.api,
    });
  }

  composeSharedGlobalInfra(config: SharedGlobalInfraConfig) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      Stage.PROD
    );

    // Creates the root DNS infrastructure for your app, necessary for enabling <yourDomain>.com to work.
    const route53StackName = infraResourceIdBuilder.createStageBasedId(
      "Shared-Route53Stack"
    );
    const baseDomainDnsInfra = new SimpleDnsStack(
      this.cdkApp,
      route53StackName,
      {
        stackName: route53StackName,
        env: {
          account: this.awsAccountId,
        },
        idBuilder: infraResourceIdBuilder,
        appDomain: config.dns.appBaseDomain,
      }
    );

    return baseDomainDnsInfra;
  }

  composeStageRegionInfra(
    stage: Stage,
    config: {
      sharedGlobalInfra: SharedGlobalInfraConfig;
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
    // In production we want emails to come from our base domain e.g. no-reply@myApp.com, in non prod we instead the one suffixed
    // with stages such as no-reply@prod.myApp.com.
    // It's important to create unique email identity for non prod stages so we don't ruin our email reputation stats with tests.
    if (stage === Stage.PROD) {
      emailInfra = this.createEmailInfra(stage, config.email.region, {
        appDomain: config.sharedGlobalInfra.dns.appBaseDomain,
      });
    } else {
      const basicDnsInfra = this.createBasicDnsInfra(
        stage,
        config.sharedGlobalInfra
      );
      emailInfra = this.createEmailInfra(stage, config.email.region, {
        appDomain: basicDnsInfra.appDomainName,
      });
    }

    const userAuthInfra = this.createUserAuthInfra(
      stage,
      {
        emailStack: emailInfra,
        databaseStack: databaseInfra,
      },
      config.userAuth
    );

    const publicApiInfra = this.createPublicApiInfra(
      stage,
      config.api.publicApi.region,
      {
        dependantInfra: {
          sharedGlobalInfra: config.sharedGlobalInfra,
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
   * Creates a hosted zone for your app stage, e.g. beta.myApp.com
   */
  createBasicDnsInfra(
    stage: Stage,
    sharedGlobalInfra: SharedGlobalInfraConfig
  ) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );
    const route53StackName =
      infraResourceIdBuilder.createStageBasedId("Route53Stack");

    const appDomainName = `${stage.toString().toLowerCase()}.${
      sharedGlobalInfra.dns.appBaseDomain
    }`;

    const route53Stack = new SimpleDnsStack(this.cdkApp, route53StackName, {
      stackName: route53StackName,
      env: {
        account: this.awsAccountId,
      },
      terminationProtection: true,
      idBuilder: infraResourceIdBuilder,
      appDomain: appDomainName,
    });

    return {
      dnsStack: route53Stack,
      appDomainName: appDomainName,
    };
  }

  createDatabaseInfra(stage: Stage, props: CreateDatabaseInfraConfig) {
    if (props.databaseType === "dynamodb") {
      const infraResourceIdBuilder = new InfraResourceIdBuilder(
        this.appName,
        stage
      );
      const dynamoDbStackName =
        infraResourceIdBuilder.createStageBasedId("DynamoDBStack");
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
    const sesStackName = infraResourceIdBuilder.createStageBasedId("SesStack");
    const sesStack = new SesStack(this.cdkApp, sesStackName, {
      stackName: sesStackName,
      env: {
        account: this.awsAccountId,
        region: region,
      },
      terminationProtection: true,
      idBuilder: infraResourceIdBuilder,
      appDomain: props.appDomain,
    });

    return sesStack;
  }

  createUserAuthInfra(
    stage: Stage,
    /**
     * Infrastructure stacks User Auth infrastructure is dependant on
     */
    dependantInfra: {
      databaseStack: DynamoDBStack;
      emailStack: SesStack;
    },
    props: CreateUserAuthInfraProps
  ) {
    const infraResourceIdBuilder = new InfraResourceIdBuilder(
      this.appName,
      stage
    );

    const cognitoStackName =
      infraResourceIdBuilder.createStageBasedId("CognitoStack");
    const cognitoStack = new CognitoStack(this.cdkApp, cognitoStackName, {
      stackName: cognitoStackName,
      env: {
        region: props.cognito.region,
        account: this.awsAccountId,
      },
      terminationProtection: true,
      crossRegionReferences: true,
      stage: stage,
      idBuilder: infraResourceIdBuilder,
      userDynamoDbTable: dependantInfra.databaseStack.userTableData,
      appDisplayName: this.appName,
      frontEndVerifyAccountCodeURL: props.cognito.frontEndVerifyAccountCodeURL,
      noReplyEmailInfra: dependantInfra.emailStack.noReplyEmailInfra,
      preSignupLambdaTriggerConfig: props.cognito.preSignupLambdaTriggerConfig,
      postConfirmationLambdaTriggerConfig:
        props.cognito.postConfirmationLambdaTriggerConfig,
    });

    return {
      cognitoStack: cognitoStack,
    };
  }

  createPublicApiInfra(
    stage: Stage,
    region: string,
    props: {
      dependantInfra: {
        sharedGlobalInfra: SharedGlobalInfraConfig;
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
    const publicApiStackName =
      infraResourceIdBuilder.createStageBasedId("PublicApi");

    let publicApiDomainName;

    publicApiDomainName = `${stage.toString().toLowerCase()}.${region}.api.${
      dependantInfra.sharedGlobalInfra.dns.appBaseDomain
    }`;

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
      apiDomainName: publicApiDomainName,
      cognitoUserPool: dependantInfra.cognitoUserPool,
      userDatabaseTableData: dependantInfra.userDatabaseTableData,
      lambdaApiEndpointConfig: apiConfig.publicApi.lambdaApiEndpointConfig,
    });
  }
}
