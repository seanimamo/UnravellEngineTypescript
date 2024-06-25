import { CustomMessageTriggerEvent } from "aws-lambda";

export { BasicCognitoCustomMessageEventHandler } from "./BasicCognitoCustomMessageEventHandler";

export interface ICognitoCustomMessageEventHandler {
  handleEvent(
    event: CustomMessageTriggerEvent
  ): Promise<CustomMessageTriggerEvent>;
}
