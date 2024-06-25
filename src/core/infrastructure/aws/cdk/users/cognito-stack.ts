import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
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
import { Stage } from "../../../common/Stage";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";
import { DynamoTableData, isDynamoTableData } from "../database/dynamodb-stack";
import * as ses from "aws-cdk-lib/aws-ses";
import { IDatabaseTableData } from "../database";
import * as kms from "aws-cdk-lib/aws-kms";
import { CustomNodeJsLambdaConfig } from "..";

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
   * Database table data necessary to give pre and post signup lambdas database access.
   */
  userDbTable: IDatabaseTableData;
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
  emailInfra: {
    sesIdentity: ses.EmailIdentity;
    emailAddress: string;
  };
  /**
   * The configuration for setting up the Cognito Pre Sign-up lambda trigger
   */
  preSignupLambdaTriggerConfig: CustomNodeJsLambdaConfig;

  /**
   * The configuration for setting up the Cognito Post confirmation lambda trigger
   */
  postConfirmationLambdaTriggerConfig: CustomNodeJsLambdaConfig;
  /**
   * The logic for how emails will be sent from Cognito.
   */
  mailingLogic: {
    /**
     * The method of sending emails, 'custom' means you want to completely use your own emailing logic
     * whereas 'cognito' means we're using the built in email sending logic.
     */
    method: "custom" | "cognito";
    /**
     * The configuration for setting up the Cognito custom email sender lambda.
     * This allows us to either customize the automatic emails in 'cognito' mode or insert our own custom logic.
     */
    customEmailLambdaTrigger?: CustomNodeJsLambdaConfig;
  };
};

export class CognitoStack extends Stack {
  public readonly userPool: UserPool;
  public readonly props: CognitoStackProps;

  private idBuilder: InfraResourceIdBuilder;
  private appDisplayName: string;

  constructor(
    scope: Construct,
    id: string,
    awsStackProps: StackProps,
    props: CognitoStackProps
  ) {
    super(scope, id, awsStackProps);

    this.idBuilder = props.idBuilder;
    this.appDisplayName = props.appDisplayName;
    this.props = props;

    const { cognitoUserPool } = this.createCognitoUserPool();
    this.userPool = cognitoUserPool;
    this.addCoreUserPoolLambdaTriggers(this.userPool);
    this.createUserPoolUIClient(cognitoUserPool);
  }

  createCognitoUserPool() {
    const { mailingLogic } = this.props;
    const userPoolName = this.idBuilder.stageBasedId("UserPool");

    // This will be used to enable us to customize email messages programmatically.
    let emailKmsKey: kms.IKey | undefined;
    if (mailingLogic.method === "custom") {
      emailKmsKey = new kms.Key(
        this,
        this.idBuilder.stageBasedId("CognitoEmailSenderKmsKey"),
        {
          removalPolicy: RemovalPolicy.DESTROY,
          description:
            "KMS key used for encrypting cognito custom email sender messages.",
          alias: "cognito-email-sender-key",
          keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        }
      );
    }

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
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false,
      },
      accountRecovery: AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
      mfa: Mfa.OPTIONAL,
      // Required for when we want to handle sending emails instead of cognito.
      customSenderKmsKey: emailKmsKey,
    });

    const cfnUserPool = cognitoUserPool.node.defaultChild as CfnUserPool;

    /**
     * This enables cognitos to send its automatic emails using our own custom app email domain.
     */
    cfnUserPool.emailConfiguration = {
      emailSendingAccount: "DEVELOPER",
      from: this.props.emailInfra.emailAddress,
      sourceArn: this.props.emailInfra.sesIdentity.emailIdentityArn,
    };

    if (
      mailingLogic.method === "cognito" &&
      mailingLogic.customEmailLambdaTrigger !== undefined
    ) {
      this.addCustomMessageSenderLambdaTrigger(
        cognitoUserPool,
        mailingLogic.customEmailLambdaTrigger
      );
    }

    if (mailingLogic.method === "custom") {
      if (mailingLogic.customEmailLambdaTrigger == undefined) {
        throw new Error(
          "You must provide a email sending lambda when setting mailingLogic to 'custom' with cognito"
        );
      }

      this.addEmailSenderLambdaTrigger(
        cognitoUserPool,
        emailKmsKey!,
        mailingLogic.customEmailLambdaTrigger
      );
    }

    return {
      cognitoUserPool,
      emailKmsKey,
    };
  }

  /**
   * Creates User Pool Client
   */
  createUserPoolUIClient(cognitoUserPool: UserPool) {
    const userPoolId = this.idBuilder.stageBasedId("UserPoolClient");
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

  addCoreUserPoolLambdaTriggers(cognitoUserPool: UserPool) {
    const {
      stage,
      preSignupLambdaTriggerConfig,
      postConfirmationLambdaTriggerConfig,
      userDbTable,
    } = this.props;

    if (!isDynamoTableData(userDbTable)) {
      throw new Error(
        "Only dynamodb is supported for user database table at this time."
      );
    }

    const preSignUpLambdaId = this.idBuilder.stageBasedId(
      "CognitoPreSignUpLambda"
    );
    const preSignUpLambdaTrigger = new NodejsFunction(this, preSignUpLambdaId, {
      functionName: preSignUpLambdaId,
      runtime: Runtime.NODEJS_16_X,
      entry: preSignupLambdaTriggerConfig.entry,
      handler: preSignupLambdaTriggerConfig.handler,
      architecture:
        preSignupLambdaTriggerConfig.architecture ?? Architecture.ARM_64,
      memorySize: preSignupLambdaTriggerConfig.memorySize ?? 1024, // This memory amount is overkill but will minimize cold start time
      environment: {
        ...preSignupLambdaTriggerConfig.environment,
        STAGE: stage,
        USER_DB_TABLE_NAME: userDbTable.tableName,
      },
      initialPolicy: [
        this.createDynamoAllowPolicyForAllIndexes(
          ["dynamodb:PutItem", "dynamodb:Query"],
          userDbTable
        ),
        ...(preSignupLambdaTriggerConfig.initialPolicy ?? []),
      ],
      bundling: {
        minify: true,
        esbuildArgs: {
          // Pass additional arguments to esbuild
          // "--analyze": true,
        },
        ...preSignupLambdaTriggerConfig.bundling,
      },
    });
    cognitoUserPool.addTrigger(
      UserPoolOperation.PRE_SIGN_UP,
      preSignUpLambdaTrigger
    );

    const postConfirmationLambdaId = this.idBuilder.stageBasedId(
      "CognitoPostConfirmationLambda"
    );
    const postConfirmationLambdaTrigger = new NodejsFunction(
      this,
      postConfirmationLambdaId,
      {
        functionName: postConfirmationLambdaId,
        runtime: Runtime.NODEJS_16_X,
        entry: postConfirmationLambdaTriggerConfig.entry,
        handler: postConfirmationLambdaTriggerConfig.handler,
        architecture:
          postConfirmationLambdaTriggerConfig.architecture ??
          Architecture.ARM_64,
        memorySize: postConfirmationLambdaTriggerConfig.memorySize ?? 1024, // This memory amount is overkill but will minimize cold start time
        environment: {
          ...preSignupLambdaTriggerConfig.environment,
          STAGE: stage,
          USER_DB_TABLE_NAME: userDbTable.tableName,
        },
        initialPolicy: [
          this.createDynamoAllowPolicyForAllIndexes(
            ["dynamodb:UpdateItem", "dynamodb:Query"],
            userDbTable
          ),
          ...(postConfirmationLambdaTriggerConfig.initialPolicy ?? []),
        ],
        bundling: {
          minify: true,
          esbuildArgs: {
            // Pass additional arguments to esbuild
            // "--analyze": true,
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

  /**
   * Adds an AWS lambda function to handle sending emails instead of using built in cognito functionality
   */
  private addEmailSenderLambdaTrigger(
    userPool: UserPool,
    emailSenderKmsKey: kms.IKey,
    lambdaConfig: CustomNodeJsLambdaConfig
  ) {
    const customEmailSenderLambdaId = this.idBuilder.stageBasedId(
      "CognitoCustomEmailSenderLambda"
    );
    const customEmailSenderLambda = new NodejsFunction(
      this,
      customEmailSenderLambdaId,
      {
        functionName: customEmailSenderLambdaId,
        runtime: Runtime.NODEJS_16_X,
        entry: lambdaConfig.entry,
        handler: lambdaConfig.handler,
        architecture: lambdaConfig.architecture ?? Architecture.ARM_64,
        memorySize: lambdaConfig.memorySize ?? 256,
        environment: {
          ...lambdaConfig.environment,
          KMS_KEY_ARN: emailSenderKmsKey.keyArn,
          FRONT_END_VERIFY_CODE_URL: this.props.frontEndVerifyAccountCodeURL,
        },
        initialPolicy: [...(lambdaConfig.initialPolicy ?? [])],
        bundling: {
          minify: true,
          esbuildArgs: {
            // Pass additional arguments to esbuild
            // "--analyze": true,
          },
          ...lambdaConfig.bundling,
        },
      }
    );

    emailSenderKmsKey.grantDecrypt(customEmailSenderLambda);

    userPool.addTrigger(
      UserPoolOperation.CUSTOM_EMAIL_SENDER,
      customEmailSenderLambda
    );
  }

  /**
   * Adds an AWS lambda function to handle customizing outgoing emails from cognito
   */
  private addCustomMessageSenderLambdaTrigger(
    userPool: UserPool,
    lambdaConfig: CustomNodeJsLambdaConfig
  ) {
    const customEmailSenderLambdaId = this.idBuilder.stageBasedId(
      "CognitoCustomMessageSenderLambda"
    );
    const customEmailSenderLambda = new NodejsFunction(
      this,
      customEmailSenderLambdaId,
      {
        functionName: customEmailSenderLambdaId,
        runtime: Runtime.NODEJS_16_X,
        entry: lambdaConfig.entry,
        handler: lambdaConfig.handler,
        architecture: lambdaConfig.architecture ?? Architecture.ARM_64,
        memorySize: lambdaConfig.memorySize ?? 256,
        environment: {
          ...lambdaConfig.environment,
          FRONT_END_VERIFY_CODE_URL: this.props.frontEndVerifyAccountCodeURL,
        },
        initialPolicy: [...(lambdaConfig.initialPolicy ?? [])],
        bundling: {
          minify: true,
          esbuildArgs: {
            // Pass additional arguments to esbuild
            // "--analyze": true,
          },
          ...lambdaConfig.bundling,
        },
      }
    );

    userPool.addTrigger(
      UserPoolOperation.CUSTOM_MESSAGE,
      customEmailSenderLambda
    );
  }

  private createDynamoAllowPolicyForAllIndexes(
    actions: string[],
    userDbTableData: DynamoTableData
  ) {
    return new PolicyStatement({
      actions,
      effect: Effect.ALLOW,
      resources: [
        userDbTableData.table.tableArn,
        ...userDbTableData.globalSecondaryIndexes.map((index) => index.arn),
      ],
    });
  }
}
