import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyWithCognitoAuthorizerEvent,
} from "aws-lambda";
import {
  BasicListUserStripeSubcriptionsApi,
  IListUserStripeSubcriptionApiRequest,
} from "../../../../../../core/api/public/resources/user/stripe/BasicListUserStripeSubcriptionsApi";
import { UnauthorizedApiError } from "../../../../../../core/api/ApiError";

export class ListUserStripeSubscriptions extends BasicListUserStripeSubcriptionsApi<
  APIGatewayProxyWithCognitoAuthorizerEvent,
  APIGatewayProxyCognitoAuthorizer
> {
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
    authData: APIGatewayProxyCognitoAuthorizer,
    request: IListUserStripeSubcriptionApiRequest
  ): Promise<void> {
    const cognitoUsername = authData.claims["cognitoUsername"];
    if (request.userId !== cognitoUsername) {
      throw new UnauthorizedApiError(
        `Cognito auth data username does not match request uuid`
      );
    }
  }
}
