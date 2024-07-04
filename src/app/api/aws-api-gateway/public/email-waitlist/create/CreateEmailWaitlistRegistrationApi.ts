import { ICreateEmailWaitlistRegistrationApiRequest } from "@/core/features/email/email-waitlist/api/BasicCreateEmailWaitlistRegistrationApi";
import { BasicCreateEmailWaitlistRegistrationApi } from "@/core/features/email/email-waitlist/index";
import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";

/**
 * The Api Processor for the CreateEmailWaitlistRegistrationApi.
 * It handles the incoming api request, processes it and returns a response.
 */
export class CreateEmailWaitlistRegistrationApi extends BasicCreateEmailWaitlistRegistrationApi<APIGatewayProxyWithCognitoAuthorizerEvent> {
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): ICreateEmailWaitlistRegistrationApiRequest {
    return {
      email: event.pathParameters?.email,
    } as ICreateEmailWaitlistRegistrationApiRequest;
  }
}
