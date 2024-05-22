import {
    Context,
    PreSignUpTriggerEvent,
    PreSignUpTriggerHandler,
} from "aws-lambda";
import { ICognitoPreSignUpWebhook } from ".";

/**
 * Class that provides the function expected by AWS Lambda for the
 * AWS Cognito Lambda Pre Sign up trigger Lambda.
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
 */
export class CognitoPreSignUpTriggerLambda {
    constructor(private readonly preSignUpWebhook: ICognitoPreSignUpWebhook) {}

    handleRequest: PreSignUpTriggerHandler = async (
        event: PreSignUpTriggerEvent,
        context: Context,
        callback
    ) => {
        await this.preSignUpWebhook.handleEvent(event);
        // Returns response to Amazon Cognito
        callback(null, event);
    };
}
