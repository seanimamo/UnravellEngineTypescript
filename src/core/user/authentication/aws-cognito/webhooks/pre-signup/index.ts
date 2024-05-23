import { PreSignUpTriggerEvent } from "aws-lambda";

export { CognitoPreSignUpTriggerLambda } from "./CognitoPreSignUpTriggerLambda";

export { BasicCognitoPreSignUpWebhook } from "./BasicCognitoPreSignUpWebhook";

export interface ICognitoPreSignUpWebhook {
    handleEvent(event: PreSignUpTriggerEvent): Promise<void>;
}
