import {
  Context,
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from "aws-lambda";

export { BasicCognitoPostConfirmationEventHandler } from "./BasicCognitoPostConfirmationEventHandler";

export interface ICognitoPostConfirmationUpEventHandler {
  handleEvent(event: PostConfirmationTriggerEvent): Promise<void>;
}

/**
 * Utility class that provides the function expected by AWS Lambda for the
 * AWS Cognito Lambda PostConfirmation Trigger lambda
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
 */
export class CognitoPostConfirmationTriggerLambda {
  constructor(
    private readonly postConfirmationWebhook: ICognitoPostConfirmationUpEventHandler
  ) {}

  handleRequest: PostConfirmationTriggerHandler = async (
    event: PostConfirmationTriggerEvent,
    context: Context,
    callback
  ) => {
    await this.postConfirmationWebhook.handleEvent(event);
    // Returns response to Amazon Cognito
    callback(null, event);
  };
}
