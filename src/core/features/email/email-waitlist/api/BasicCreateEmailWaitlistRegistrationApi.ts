import {
  InvalidRequestApiError,
  UniqueObjectAlreadyExistsApiError,
} from "@/core/api/public/error";
import { IApiRequestProcessor, IHttpApiResponse } from "@/core/api/public";
import { z } from "zod";
import { combineZodErrorMessages } from "../../../../util/zodUtils";
import { IEmailWaitlistRegistrationRepo } from "../IEmailWaitlistRegistrationRepo";
import { UniqueObjectAlreadyExistsDbError } from "@/core/database/DatabaseError";
import { validateApiRequestWithZod } from "@/core/api/utils/validationUtils";

export interface ICreateEmailWaitlistRegistrationApiRequest {
  email: string;
}

export type ICreateEmailWaitlistRegistrationApiResponse = null;

interface ApiParams {
  notifications?: {
    email?: {
      sendWelcomeEmail?: (email: string) => Promise<any>;
    };
  };
}

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for retrieing user information.
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicCreateEmailWaitlistRegistrationApi<TSourceEvent>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      ICreateEmailWaitlistRegistrationApiRequest,
      ICreateEmailWaitlistRegistrationApiResponse
    >
{
  constructor(
    private readonly dbRepo: IEmailWaitlistRegistrationRepo,
    private readonly params?: ApiParams
  ) {}

  /**
   * Extracts the API request from the TSourceEvent the API endpoint will recieve.
   * @param event Then source event API endpoint will recieve. In most cases this will likely contain http request infomration
   */
  abstract extractRequest(
    event: TSourceEvent
  ): ICreateEmailWaitlistRegistrationApiRequest;

  /**
   * Validates that the information within the API request exists and is in an expected format.
   *
   * @remarks API Request data comes from clients which we cannot control so we need to validate them.
   * @remarks Consider extending this if you have your own implementation of {@link ICreateEmailWaitlistRegistrationApiRequest}
   */
  async validateRequestData(
    request: ICreateEmailWaitlistRegistrationApiRequest
  ): Promise<void> {
    const validationSchema = z.object({
      email: z.string().email(),
      createDate: z.date(),
    });

    validateApiRequestWithZod(validationSchema, request);
  }

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  async processRequest(
    request: ICreateEmailWaitlistRegistrationApiRequest
  ): Promise<IHttpApiResponse<ICreateEmailWaitlistRegistrationApiResponse>> {
    try {
      this.dbRepo.save({
        email: request.email,
        createDate: new Date(),
      });
    } catch (error) {
      if (error instanceof UniqueObjectAlreadyExistsDbError) {
        throw new UniqueObjectAlreadyExistsApiError(
          "email is already registered"
        );
      }
    }

    // TODO: ADD Welcome email sending logic.
    if (this.params?.notifications?.email?.sendWelcomeEmail) {
      console.log("Sending welcome email");
      const sendEmailRes =
        await this.params?.notifications?.email?.sendWelcomeEmail(
          request.email
        );
      console.log("send welcome email result: ", sendEmailRes);
    }

    return {
      statusCode: 200,
      body: {
        data: null,
      },
    };
  }
}
