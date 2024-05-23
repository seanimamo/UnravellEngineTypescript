import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyWithCognitoAuthorizerEvent,
} from "aws-lambda";
import {
  BasicGetUserApi,
  IGetUserApiRequest,
} from "../../../../../core/api/public/resources/user/BasicGetUserApi";
import { User } from "../../../../user/objects";
import { UnauthorizedApiError } from "../../../../../core/api/ApiError";
import { PublicApiGatewayProxyRequestHandler } from "../PublicApiGatewayProxyRequestHandler";
import { UserResourceFactory } from "../../../../user/UserResourceFactory";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AWS_INFRA_CONFIG } from "../../../../infrastructure/aws/cdk/config";
import { DateSerializer } from "../../../../../core/database/serialization/DateSerializer";

export type GetUserApiResponse = {
  id: string;
  email: string;
  joinDate: string;
  firstName?: string;
  lastName?: string;
};

export class GetUserApi extends BasicGetUserApi<
  APIGatewayProxyWithCognitoAuthorizerEvent,
  APIGatewayProxyCognitoAuthorizer
> {
  /**
   * Extracts the API request data from the source api event
   */
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): IGetUserApiRequest {
    return { userId: event.pathParameters?.userId } as IGetUserApiRequest;
  }

  /**
   * Users can only request their own user data.
   */
  async authorizeRequest(
    authData: APIGatewayProxyCognitoAuthorizer,
    request: IGetUserApiRequest
  ): Promise<void> {
    const cognitoUsername = authData.claims["cognitoUsername"];
    if (request.userId !== cognitoUsername) {
      throw new UnauthorizedApiError(
        `Cognito auth data username does not match request uuid`
      );
    }
  }

  /**
   * Returns the data within the response. Note this is not the entire response.
   */
  createTrimmedUserDataResponse(user: User): GetUserApiResponse {
    return {
      id: user.id,
      email: user.email,
      joinDate: DateSerializer.serialize(user.joinDate) as string,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}

const getUserApiLambda = new PublicApiGatewayProxyRequestHandler(
  new GetUserApi(
    new UserResourceFactory(
      new DynamoDBClient(AWS_INFRA_CONFIG.deploymentRegion)
    ).getUserRepo()
  )
);

export const getUserApiLambda_handleRequest =
  getUserApiLambda.handleRequest.bind(getUserApiLambda);
