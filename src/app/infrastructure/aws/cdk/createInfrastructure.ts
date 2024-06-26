// This file is the entry point of your shared AWS CDK infrastructure.
// Meaning, infrastructure resources that will be shared across all stages of your application.
// When this app is executed, new AWS infrastructure templates will be created that you can then deploy.

import { Stage } from "../../../../core/infrastructure";
import { CoreAwsInfraBuilder } from "../../../../core/infrastructure/aws/cdk/CoreAwsInfraBuilder";
import { AWS_INFRA_CONFIG } from "./config";
import * as path from "path";

const coreAppInfraBuilder = new CoreAwsInfraBuilder(
  AWS_INFRA_CONFIG.appName,
  AWS_INFRA_CONFIG.awsAccountId
);

/**
 * This builds AWS cdk templates for all the parts of our application we'd need for the simple layered application architecture.
 * This does not deploy our application, it only produces the CDK templates that we have to then deploy.
 */
coreAppInfraBuilder.buildAppInfra({
  // Infrastructure shared between all stages and
  sharedGlobalInfra: {
    dns: {
      appBaseDomain: AWS_INFRA_CONFIG.dns.primaryAppDomain,
      stackRegion: AWS_INFRA_CONFIG.deploymentRegion,
    },
  },
  stageInfra: {
    stage: Stage.BETA,
    database: {
      databaseType: "dynamodb",
      region: AWS_INFRA_CONFIG.deploymentRegion,
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
        region: AWS_INFRA_CONFIG.deploymentRegion,
        // The URL cognito will send to users emails for account verification
        frontEndVerifyAccountCodeURL: `https://www.beta-${AWS_INFRA_CONFIG.dns.primaryAppDomain}/account/verify`,
        frontEndPasswordResetCodeURL: `https://www.beta-${AWS_INFRA_CONFIG.dns.primaryAppDomain}/account/reset-password`,
        // Configuration for our custom lambda function that runs during user signups
        preSignupLambdaTriggerConfig: {
          // The path to the file our lambda file is in
          entry: path.join(
            __dirname,
            "../../../user/authentication/aws-cognito/triggers/CognitoPreSignUpTriggerLambda.ts"
          ),
          // The  name of the actual function within the file that will be the lambda
          handler: "awsLambda",
          // The environment variables on the lambda, these can be changed without having to redeploy.
          environment: {
            // This enables us to turn signing up on and off like a switch on our lambda
            IS_SIGN_UP_ALLOWED: "true",
          },
        },
        // Configuration for our custom lambda function that runs after a user confirms their account
        postConfirmationLambdaTriggerConfig: {
          entry: path.join(
            __dirname,
            "../../../user/authentication/aws-cognito/triggers/CognitoPostConfirmationTriggerLambda.ts"
          ),
          handler: "awsLambda",
          bundling: {
            esbuildArgs: {
              // Pass additional arguments to esbuild
              // "--analyze": true,
            },
          },
        },
        mailingLogic: {
          method: "cognito",
          customEmailLambdaTrigger: {
            entry: path.join(
              __dirname,
              "../../../user/authentication/aws-cognito/triggers/CognitoCustomMessageTriggerLambda.ts"
            ),
            handler: "awsLambda",
          },
        },
      },
    },
    email: {
      region: AWS_INFRA_CONFIG.deploymentRegion,
    },
    api: {
      publicApi: {
        region: AWS_INFRA_CONFIG.deploymentRegion,
        lambdaApiEndpointConfig: {
          getUserByUserId: {
            entry: path.join(
              __dirname,
              "../../../api/aws-api-gateway/public/user/GetUserApi.ts"
            ),
            handler: "getUserApiLambda_handleRequest",
          },
        },
      },
    },
  },
});
