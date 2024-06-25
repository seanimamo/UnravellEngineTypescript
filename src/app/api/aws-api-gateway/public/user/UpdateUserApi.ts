import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyWithCognitoAuthorizerEvent,
} from "aws-lambda";
import {
  BasicUpdateUserApi,
  IUpdateUserApiRequest,
} from "../../../../../core/api/public/resources/user/BasicUpdateUserApi";
import { UnauthorizedApiError } from "../../../../../core/api/ApiError";
import { PublicApiGatewayProxyRequestHandler } from "../PublicApiGatewayProxyRequestHandler";
import { UserResourceFactory } from "../../../../user/UserResourceFactory";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AWS_INFRA_CONFIG } from "../../../../infrastructure/aws/cdk/config";

/**
 * Class containing the code logic for handling a "get user" public api endpoint.
 *
 * @see {@link BasicUpdateUserApi}
 */
export class UpdateUserApi extends BasicUpdateUserApi<
  APIGatewayProxyWithCognitoAuthorizerEvent,
  APIGatewayProxyCognitoAuthorizer
> {
  /**
   * Extracts the API request data from the source api event
   */
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): IUpdateUserApiRequest {
    return {
      userId: event.pathParameters?.userId,
    } as IUpdateUserApiRequest;
  }

  /**
   * Users can only update their own user data.
   */
  async authorizeRequest(
    authData: APIGatewayProxyCognitoAuthorizer,
    request: IUpdateUserApiRequest
  ): Promise<void> {
    const cognitoUsername = authData.claims["cognitoUsername"];
    if (request.userId !== cognitoUsername) {
      throw new UnauthorizedApiError(
        `Cognito auth data username does not match request uuid`
      );
    }
  }
}

const updateUserApiLambda = new PublicApiGatewayProxyRequestHandler(
  new UpdateUserApi(
    new UserResourceFactory(
      new DynamoDBClient(AWS_INFRA_CONFIG.deploymentRegion),
      process.env.USER_DB_TABLE_NAME!
    ).getUserRepo()
  )
);

export const updateUserApiLambda_handleRequest =
  updateUserApiLambda.handleRequest.bind(updateUserApiLambda);
