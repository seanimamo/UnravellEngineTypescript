import { PostConfirmationTriggerEvent } from "aws-lambda";

export { CognitoPostConfirmationTriggerLambda } from "./CognitoPostConfirmationTriggerLambda";
export { BasicCognitoPostConfirmationWebhook } from "./BasicCognitoPostConfirmationWebhook";

export interface ICognitoPostConfirmationUpWebhook {
    handleEvent(event: PostConfirmationTriggerEvent): Promise<void>;
}
