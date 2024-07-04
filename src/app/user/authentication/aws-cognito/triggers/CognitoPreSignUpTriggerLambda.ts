import "dotenv/config"; // This enables to access a local .env file
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UserResourceFactory } from "../../../UserResourceFactory";
import { AWS_INFRA_CONFIG } from "../../../../infrastructure/aws/cdk/config";
import { BasicCognitoPreSignUpEventHandler } from "../../../../../core/user/authentication/aws-cognito/triggers/pre-signup";
import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from "aws-lambda";

/**
 * This is the core logic handler for the cognito pre signup trigger event.
 * @remarks You can add custom logic here by using your own class that either extends {@link BasicCognitoPreSignUpEventHandler}
 * or simply implements the ICognitoPreSignUpEventHandler interface.
 */
const preSignUpEventHandler = new BasicCognitoPreSignUpEventHandler(
  new UserResourceFactory(
    new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
  )
  // TODO: Uncomment this once stripe account is ready.
  // new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //   apiVersion: "2022-11-15",
  // })
);

/**
 * This is the actual lambda function that we will use in our aws infrastructure
 */
export const awsLambda: PreSignUpTriggerHandler = async function (
  event: PreSignUpTriggerEvent,
  context,
  callback
) {
  try {
    await preSignUpEventHandler.handleEvent(event);
  } catch (error) {
    if (error instanceof Error) {
      callback(error, event);
      return;
    }
  }

  // Returns response to Amazon Cognito
  callback(null, event);
};
