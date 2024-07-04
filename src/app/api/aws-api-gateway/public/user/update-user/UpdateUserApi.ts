import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import {
  BasicUpdateUserApi,
  IUpdateUserApiRequest,
} from "../../../../../../core/api/public/resources/user/BasicUpdateUserApi";
import { confirmCognitoClaimUsernameMatches } from "@/core/api/utils/aws-api-gateway/utils";

export type UpdateUserApiRequest = IUpdateUserApiRequest;

/**
 * Class containing the code logic for handling a "get user" public api endpoint.
 *
 * @see {@link BasicUpdateUserApi}
 */
export class UpdateUserApi extends BasicUpdateUserApi<APIGatewayProxyWithCognitoAuthorizerEvent> {
  /**
   * Extracts the API request data from the source api event
   */
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): UpdateUserApiRequest {
    return {
      userId: event.pathParameters?.userId,
    } as IUpdateUserApiRequest;
  }

  /**
   * Users can only update their own user data.
   */
  async authorizeRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent,
    request: IUpdateUserApiRequest
  ): Promise<void> {
    console.info(
      "Cognito Authorizor:",
      JSON.stringify(event.requestContext.authorizer)
    );

    confirmCognitoClaimUsernameMatches(request.userId, event);
  }
}
