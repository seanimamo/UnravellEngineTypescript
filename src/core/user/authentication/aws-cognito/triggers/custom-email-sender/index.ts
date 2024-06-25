import { CustomEmailSenderTriggerEvent } from "aws-lambda";

export { BasicCognitoCustomEmailSenderEventHandler } from "./BasicCustomEmailSenderEventHandler";

export interface ICognitoCustomEmailSenderEventHandler {
  handleEvent(
    event: CustomEmailSenderTriggerEvent
  ): Promise<CustomEmailSenderTriggerEvent>;
}
