import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import {
  BasicListUserStripeSubcriptionsApi,
  IListUserStripeSubcriptionApiRequest,
} from "../../../../../../core/api/public/resources/user/stripe/BasicListUserStripeSubcriptionsApi";
import { confirmCognitoClaimUsernameMatches } from "@/core/api/utils/aws-api-gateway/utils";

export class ListUserStripeSubscriptions extends BasicListUserStripeSubcriptionsApi<APIGatewayProxyWithCognitoAuthorizerEvent> {
  /**
   * Extracts the API request data from the source api event
   */
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): IListUserStripeSubcriptionApiRequest {
    return {
      userId: event.pathParameters?.userId,
    } as IListUserStripeSubcriptionApiRequest;
  }

  /**
   * Users can only request their own stripe subscription data
   */
  async authorizeRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent,
    request: IListUserStripeSubcriptionApiRequest
  ): Promise<void> {
    console.info(
      "Cognito Authorizor:",
      JSON.stringify(event.requestContext.authorizer)
    );

    confirmCognitoClaimUsernameMatches(request.userId, event);
  }
}
