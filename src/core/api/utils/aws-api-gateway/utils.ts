import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { UnauthorizedApiError } from "../../public/error";

/**
 * Validates that the provided api requester username matches the one within the
 * cognito authorizer
 *
 * @remarks API gateway events with cognito attached as an authorizer have a special
 * field within the APIGatewayProxyEvent containing authorization data from cognito.
 *
 * @throws - {@link UnauthorizedApiError} if username does not match
 * the username within the cognito claims
 */
export function confirmCognitoClaimUsernameMatches(
  username: string,
  event: APIGatewayProxyWithCognitoAuthorizerEvent
) {
  const cognitoUsername =
    event.requestContext.authorizer.claims["cognitoUsername"];
  if (username !== cognitoUsername) {
    throw new UnauthorizedApiError(
      `Cognito auth data username does not match request uuid`
    );
  }
}
