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
          frontEndVerifyCodeURL: `https://wwww.beta-${AWS_INFRA_CONFIG.dns.primaryAppDomain}/account/verify`,
          region: "us-east-1",
          preSignupLambdaTriggerConfig: {
            codePath:
              "../../../user/aws-cognito/CognitoPreSignUpTriggerLambda.ts",
            lambdaFunctionName: "preSignUpLambdaTrigger_handleRequest",
          },
          postConfirmationLambdaTriggerConfig: {
            codePath:
              "../../../user/aws-cognito/CognitoPostConfirmationTriggerLambda.ts",
            lambdaFunctionName: "postConfirmationLambdaTrigger_handleRequest",
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
              codePath: "../../../api/aws-api-gateway/public/GetUserApi.ts",
              lambdaFunctionName: "getUserApiLambda_handleRequest",
            },
          },
        },
      },
    },
  },
});
