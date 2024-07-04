import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import {
  BasicGetUserApi,
  IGetUserApiRequest,
} from "@/core/api/public/resources/user/BasicGetUserApi";
import { User } from "../../../../../user/objects";
import { DateSerializer } from "@/core/database/serialization/DateSerializer";
import { confirmCognitoClaimUsernameMatches } from "@/core/api/utils/aws-api-gateway/utils";

export type GetUserApiResponse = {
  id: string;
  email: string;
  joinDate: string;
  firstName?: string;
  lastName?: string;
};

export type GetUserApiResponseData = {
  userId: string;
  email: string;
  joinDate: string;
  firstName?: string;
  lastName?: string;
};

export class GetUserApi extends BasicGetUserApi<APIGatewayProxyWithCognitoAuthorizerEvent> {
  extractRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent
  ): IGetUserApiRequest {
    return { userId: event.pathParameters?.userId } as IGetUserApiRequest;
  }

  /**
   * Users can only request their own user data.
   */
  async authorizeRequest(
    event: APIGatewayProxyWithCognitoAuthorizerEvent,
    request: IGetUserApiRequest
  ): Promise<void> {
    console.info(
      "Cognito Authorizor:",
      JSON.stringify(event.requestContext.authorizer)
    );

    confirmCognitoClaimUsernameMatches(request.userId, event);
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

  createApiResponse(user: User): GetUserApiResponseData {
    return {
      userId: user.id,
      email: user.email,
      joinDate: DateSerializer.serialize(user.joinDate) as string,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
