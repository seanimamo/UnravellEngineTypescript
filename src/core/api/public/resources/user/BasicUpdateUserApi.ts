import { IUserRepo } from "@/core/user/database";
import {
  DataValidator,
  DataValidationError,
  RetryAttemptsExhaustedError,
  combineZodErrorMessages,
} from "@/core/util";
import { IApiRequestProcessor, IHttpApiResponse } from "../..";
import {
  InvalidRequestApiError,
  RetryAttemptsExhaustedApiError,
} from "../../error";
import { z } from "zod";
import { validateApiRequestWithZod } from "@/core/api/utils/validationUtils";

export interface IUpdateUserApiRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
}

export type IUpdateUserApiResponseData = null;

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for updating user information.
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicUpdateUserApi<TSourceEvent>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      IUpdateUserApiRequest,
      IUpdateUserApiResponseData
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
    const validationSchema = z.object({
      userId: z.string().min(1),
      firstName: z.string().min(4).optional(),
      lastName: z.string().min(4).optional(),
    });

    validateApiRequestWithZod(validationSchema, request);
  }

  /**
   * Analyze the API request parameters and the requesters auth data and determine
   * if they are allowed to.
   *
   * @remarks this was added here to force users to atleast think about implementation authorization
   * for this endpoint.
   */
  abstract authorizeRequest(
    event: TSourceEvent,
    request: IUpdateUserApiRequest
  ): Promise<void>;

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  async processRequest(
    request: IUpdateUserApiRequest
  ): Promise<IHttpApiResponse<IUpdateUserApiResponseData>> {
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
