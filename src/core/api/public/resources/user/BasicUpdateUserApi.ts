import {
  InvalidRequestApiError,
  RetryAttemptsExhaustedApiError,
} from "../../../ApiError";
import { IUserRepo } from "@/core/user/database";
import {
  DataValidator,
  DataValidationError,
  RetryAttemptsExhaustedError,
} from "@/core/util";
import { IApiResponse } from "../../IApiResponse";
import { IApiRequestProcessor } from "../../IApiRequestProcessor";
import { IApiRequest } from "../../IApiRequest";

export interface IUpdateUserApiRequest extends IApiRequest {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface IUpdateUserApiResponse extends IApiResponse {}

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for updating user information.
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicUpdateUserApi<TSourceEvent, TAuthorizationData>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      TAuthorizationData,
      IUpdateUserApiRequest,
      IUpdateUserApiResponse
    >
{
  private readonly dataValidator = new DataValidator();

  constructor(private readonly userRepo: IUserRepo) {}

  /**
   * Extracts the API request from the TSourceEvent the API endpoint will recieve.
   * @param event Then source event API endpoint will recieve. In most cases this will likely contain http request infomration
   */
  abstract extractRequest(event: TSourceEvent): IUpdateUserApiRequest;

  /**
   * Validates that the information within the API request exists and is in an expected format.
   *
   * @remarks API Request data comes from clients which we cannot control so we need to validate them.
   * @remarks Consider extending this if you have your own implementation of {@link IUpdateUserApiRequest}
   */
  async validateRequestData(request: IUpdateUserApiRequest): Promise<void> {
    try {
      this.dataValidator
        .validate(request.id, "request.id")
        .notUndefined()
        .notNull()
        .isString()
        .notEmpty();
      this.dataValidator
        .validate(request.firstName, "firstName")
        .ifNotUndefined()
        .notNull()
        .isString()
        .notEmpty();
      this.dataValidator
        .validate(request.lastName, "lastName")
        .ifNotUndefined()
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
    request: IUpdateUserApiRequest
  ): Promise<void>;

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  async processRequest(
    request: IUpdateUserApiRequest
  ): Promise<IUpdateUserApiResponse> {
    const getUserResponse = await this.userRepo.getById(request.userId);
    const user = getUserResponse.data;

    if (user === null) {
      return {
        statusCode: 404,
        body: {
          data: null,
        },
      };
    }

    try {
      await this.userRepo.update(user.id, {
        userName: request.userName,
        firstName: request.firstName,
        lastName: request.lastName,
      });
    } catch (error) {
      if (error instanceof RetryAttemptsExhaustedError) {
        throw new RetryAttemptsExhaustedApiError();
      }
      throw error;
    }

    return {
      statusCode: 200,
      body: {
        data: null,
      },
    };
  }
}
