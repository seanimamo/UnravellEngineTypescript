import { InvalidRequestApiError } from "../../../ApiError";
import { IUserRepo } from "@/core/user/database";
import { DataValidator, DataValidationError } from "@/core/util";
import { IApiResponse } from "../../IApiResponse";
import { IUser } from "../../../../user/types";
import { IApiRequestProcessor } from "../../IApiRequestProcessor";
import { IApiRequest } from "../../IApiRequest";

export interface IGetUserApiRequest extends IApiRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
}

/**
 * The response type for the {@link BasicGetUserApi}.
 * Since the response data is created using the abstract method {@link BasicGetUserApi.createTrimmedUserDataResponse}
 * we don't know what the response data type will be so this type does not have  concrete type definitions.
 */
export interface IGetUserApiResponse extends IApiResponse {}

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for retrieing user information.
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicGetUserApi<TSourceEvent, TAuthorizationData>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      TAuthorizationData,
      IGetUserApiRequest,
      IGetUserApiResponse
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
    try {
      this.dataValidator
        .validate(request.id, "request.id")
        .notUndefined()
        .notNull()
        .isString()
        .notEmpty();
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw new InvalidRequestApiError(
          `Request has one or more missing or invalid attributes: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Analyze the API request parameters and the requesters auth data and determine
   * if they are allowed to
   */
  abstract authorizeRequest(
    authData: TAuthorizationData,
    request: IGetUserApiRequest
  ): Promise<void>;

  /**
   * Create the API response data using the retrieved user data.
   * @remarks Typically you will only want to return a subset of the user data, limiting it to only information the client needs and/or hiding sensitive information.
   */
  abstract createTrimmedUserDataResponse(
    user: IUser
  ): Record<string, unknown> | null;

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  // TODO: CONSIDER making this an abstract method.
  async processRequest(
    request: IGetUserApiRequest
  ): Promise<IGetUserApiResponse> {
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

    const trimmedUserData = this.createTrimmedUserDataResponse(user);

    return {
      statusCode: 200,
      body: {
        data: trimmedUserData,
      },
    };
  }
}
