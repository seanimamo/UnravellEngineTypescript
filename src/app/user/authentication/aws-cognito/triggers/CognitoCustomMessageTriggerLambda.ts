import {
  CustomMessageTriggerEvent,
  CustomMessageTriggerHandler,
} from "aws-lambda";
import { BasicCognitoCustomMessageEventHandler } from "../../../../../core/user/authentication/aws-cognito/triggers";

/**
 * This is the core logic handler for the cognito custom email sending lambda.
 * @remarks You can add custom logic here by using your own class that either extends {@link BasicCognitoCustomMessageEventHandler}
 * or simply implements the ICognitoPostConfirmationUpEventHandler interface.
 */
const customEmailSenderEventHandler =
  new BasicCognitoCustomMessageEventHandler();

/**
 * This is the actual lambda function that we will use in our aws infrastructure
 */
export const awsLambda: CustomMessageTriggerHandler = async function (
  event: CustomMessageTriggerEvent,
  context,
  callback
) {
  await customEmailSenderEventHandler.handleEvent(event);

  console.log("event.response: ", event.response);
  // Returns response to Amazon Cognito
  callback(null, event);
};
