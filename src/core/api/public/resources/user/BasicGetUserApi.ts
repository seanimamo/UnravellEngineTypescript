import { IUserRepo } from "@/core/user/database";
import { DataValidator } from "@/core/util";
import { IUser } from "../../../../user/types";
import { IApiRequestProcessor, IHttpApiResponse } from "../..";
import { z } from "zod";
import { validateApiRequestWithZod } from "@/core/api/utils/validationUtils";

export interface IGetUserApiRequest {
  userId: string;
}

/**
 * The response type for the {@link BasicGetUserApi}.
 * @remarks there are times when you don't want to return the full set of user data.
 */
export type IGetUserApiResponseData = {
  userId: string;
  firstName?: string;
  lastName?: string;
} | null;

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for retrieing user information.
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicGetUserApi<TSourceEvent>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      IGetUserApiRequest,
      IGetUserApiResponseData
    >
{
  private readonly dataValidator = new DataValidator();

  constructor(private readonly userRepo: IUserRepo) {}

  /**
   * Extracts the API request from the TSourceEvent the API endpoint will recieve.
   * @param event Then source event API endpoint will recieve. In most cases this will likely contain http request infomration
   */
  abstract extractRequest(event: TSourceEvent): IGetUserApiRequest;

  /**
   * Validates that the information within the API request exists and is in an expected format.
   *
   * @remarks API Request data comes from clients which we cannot control so we need to validate them.
   * @remarks Consider extending this if you have your own implementation of {@link IGetUserApiRequest}
   */
  async validateRequestData(request: IGetUserApiRequest): Promise<void> {
    const validationSchema = z.object({
      userId: z.string().min(1),
    });

    validateApiRequestWithZod(validationSchema, request);
  }

  /**
   * Create the API response data using the retrieved user data.
   * @remarks Typically you will only want to return a subset of the user data, limiting it to only information the client needs and/or hiding sensitive information.
   */
  abstract createApiResponse(user: IUser): IGetUserApiResponseData;

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  async processRequest(
    request: IGetUserApiRequest
  ): Promise<IHttpApiResponse<IGetUserApiResponseData>> {
    const getUserResponse = await this.userRepo.getById(request.userId);
    const user = getUserResponse.data;
    if (user === null) {
      return {
        statusCode: 204,
        body: {
          data: null,
        },
      };
    }

    const apiResponseData = this.createApiResponse(user);

    return {
      statusCode: 200,
      body: {
        data: apiResponseData,
      },
    };
  }
}
