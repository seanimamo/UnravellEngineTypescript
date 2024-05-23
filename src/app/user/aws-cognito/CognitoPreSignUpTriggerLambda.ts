import "dotenv/config"; // This enables to access a local .env file
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BasicCognitoPreSignUpWebhook } from "../../../core/user/authentication/aws-cognito/webhooks";
import { CognitoPreSignUpTriggerLambda } from "../../../core/user/authentication/aws-cognito/webhooks";
import { UserResourceFactory } from "../UserResourceFactory";
import Stripe from "stripe";
import { AWS_INFRA_CONFIG } from "../../infrastructure/aws/cdk/config";

/**
 * This is a concrete implementation of the {@link CognitoPreSignUpTriggerLambda}
 */
const preSignUpLambdaTrigger = new CognitoPreSignUpTriggerLambda(
  new BasicCognitoPreSignUpWebhook(
    new UserResourceFactory(
      new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
    ),
    new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2022-11-15",
    })
  )
);

/**
 * This function is necessary for us to point AWS CDK to as our Lambda function
 * because we are using a method within a class instead of just a function.
 *
 * If you call an instance method inside a handler you’re likely to get an error.
 * It is a well known side effect of passing functions as value.
 * Because they are being used in isolation through dynamic binding, they lose the calling context.
 * Luckily, this can be easily solved with context binding:
 */
export const preSignUpLambdaTrigger_handleRequest =
  preSignUpLambdaTrigger.handleRequest.bind(preSignUpLambdaTrigger);
