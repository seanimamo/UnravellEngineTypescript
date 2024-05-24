// This file is the entry point of your shared AWS CDK infrastructure.
// Meaning, infrastructure resources that will be shared across all stages of your application.
// When this app is executed, new AWS infrastructure templates will be created that you can then deploy.

import { Stage } from "../../../../core/infrastructure";
import {
  CoreAwsInfraBuilder,
  SharedGlobalInfraConfig,
} from "../../../../core/infrastructure/aws/cdk/CoreAwsInfraBuilder";
import { AWS_INFRA_CONFIG } from "./config";

const coreAppInfraBuilder = new CoreAwsInfraBuilder(
  AWS_INFRA_CONFIG.appName,
  AWS_INFRA_CONFIG.awsAccountId
);

const sharedGlobalInfraConfig: SharedGlobalInfraConfig = {
  dns: {
    appBaseDomain: AWS_INFRA_CONFIG.dns.primaryAppDomain,
  },
};

// Type 2: Build everything at once.
coreAppInfraBuilder.buildAppInfra({
  sharedGlobalInfra: sharedGlobalInfraConfig,
  stageRegionInfra: {
    stage: Stage.BETA,
    sharedInfra: {
      database: {
        databaseType: "dynamodb",
        region: "us-east-1",
        tables: {
          user: {
            tableName: AWS_INFRA_CONFIG.database.tables.user.tableName,
          },
          stripeSubscription: {
            tableName:
              AWS_INFRA_CONFIG.database.tables.stripeSubscription.tableName,
          },
        },
      },
      userAuth: {
        cognito: {
          region: "us-east-1",
          // The URL cognito will send to users emails for account verification
          frontEndVerifyAccountCodeURL: `https://wwww.beta-${AWS_INFRA_CONFIG.dns.primaryAppDomain}/account/verify`,
          // Configuration for our custom lambda function that runs during user signups
          preSignupLambdaTriggerConfig: {
            // The path to the file our lambda file is in
            entry: "../../../user/aws-cognito/CognitoPreSignUpTriggerLambda.ts",
            // The  name of the actual function within the file that will be the lambda
            handler: "preSignUpLambdaTrigger_handleRequest",
            // The environment variables on the lambda, these can be changed without having to redeploy.
            environment: {
              // This enables us to turn signing up on and off like a switch on our lambda
              IS_SIGN_UP_ALLOWED: "true",
            },
          },
          // Configuration for our custom lambda function that runs after a user confirms their account
          postConfirmationLambdaTriggerConfig: {
            entry:
              "../../../user/aws-cognito/CognitoPostConfirmationTriggerLambda.ts",
            handler: "postConfirmationLambdaTrigger_handleRequest",
          },
        },
      },
    },
    uniqueInfra: {
      api: {
        publicApi: {
          region: "us-east-1",
          lambdaApiEndpointConfig: {
            getUserByUserId: {
              entry: "../../../api/aws-api-gateway/public/GetUserApi.ts",
              handler: "getUserApiLambda_handleRequest",
            },
          },
        },
      },
    },
  },
});
