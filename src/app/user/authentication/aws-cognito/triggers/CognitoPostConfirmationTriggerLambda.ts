import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UserResourceFactory } from "../../../UserResourceFactory";
import { BasicCognitoPostConfirmationEventHandler } from "../../../../../core/user/authentication/aws-cognito/triggers/post-confirmation";
import { AWS_INFRA_CONFIG } from "../../../../infrastructure/aws/cdk/config";
import {
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from "aws-lambda";

/**
 * This is the core logic handler for the cognito post account confirmation trigger event.
 * @remarks You can add custom logic here by using your own class that either extends {@link BasicCognitoPostConfirmationEventHandler}
 * or simply implements the ICognitoPostConfirmationUpEventHandler interface.
 */
const postConfirmationEventHandler =
  new BasicCognitoPostConfirmationEventHandler(
    new UserResourceFactory(
      new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
    )
  );

/**
 * This is the actual lambda function that we will use in our aws infrastructure
 */
export const awsLambda: PostConfirmationTriggerHandler = async function (
  event: PostConfirmationTriggerEvent,
  context,
  callback
) {
  await postConfirmationEventHandler.handleEvent(event);
  // Returns response to Amazon Cognito
  callback(null, event);
};
