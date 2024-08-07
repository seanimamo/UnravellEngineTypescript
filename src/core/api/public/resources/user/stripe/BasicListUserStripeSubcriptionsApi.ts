import { DataValidator, DataValidationError } from "../../../../../util";
import { IStripeSubscriptionCacheRepo } from "../../../../../payments/stripe/subscription-cache/database";
import { IStripeSubscriptionCache } from "../../../../../payments/stripe/subscription-cache";
import { IStripeUserDataRepo } from "../../../../../payments/stripe/user-data/database";
import { IApiRequestProcessor, IPaginatedApiResponse } from "../../..";
import { InternalServerApiError, InvalidRequestApiError } from "../../../error";

export interface IListUserStripeSubcriptionApiRequest {
  userId: string;
}

export type IListUserStripeSubcriptionApiResponseData = {
  subscriptions: IStripeSubscriptionCache[];
};

/**
 * An abstract implementation of {@link IApiRequestProcessor} with basic logic for retrieing user stripe subscription data
 *
 * @remarks Feel free to make your own class that implements {@link IApiRequestProcessor} if extending this implementation is not sufficient
 */
export abstract class BasicListUserStripeSubcriptionsApi<TSourceEvent>
  implements
    IApiRequestProcessor<
      TSourceEvent,
      IListUserStripeSubcriptionApiRequest,
      IListUserStripeSubcriptionApiResponseData
    >
{
  private readonly dataValidator = new DataValidator();

  constructor(
    private readonly userStripeDataRepo: IStripeUserDataRepo,
    private readonly stripeSubscriptionRepo: IStripeSubscriptionCacheRepo
  ) {}

  /**
   * Extracts the API request from the TSourceEvent the API endpoint will recieve.
   * @param event Then source event API endpoint will recieve. In most cases this will likely contain http request infomration
   */
  abstract extractRequest(
    event: TSourceEvent
  ): IListUserStripeSubcriptionApiRequest;

  /**
   * Validates that the information within the API request exists and is in an expected format.
   *
   * @remarks API Request data comes from clients which we cannot control so we need to validate them.
   * @remarks Consider extending this if you have your own implementation of {@link IGetUserApiRequest}
   */
  async validateRequest(
    request: IListUserStripeSubcriptionApiRequest
  ): Promise<void> {
    try {
      this.dataValidator
        .validate(request.userId, "request.userId")
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
    event: TSourceEvent,
    request: IListUserStripeSubcriptionApiRequest
  ): Promise<void>;

  /**
   * The primary function that runs the logic necessary to handle the incoming API request.
   */
  async processRequest(
    request: IListUserStripeSubcriptionApiRequest
  ): Promise<IPaginatedApiResponse<IListUserStripeSubcriptionApiResponseData>> {
    const userStripeDataResponse = await this.userStripeDataRepo.getByUserId(
      request.userId
    );
    const userStripeData = userStripeDataResponse.data;

    if (userStripeData === null) {
      console.error("User unexpectedly does not have a stripe customer id");
      throw new InternalServerApiError(
        "User unexpectedly does not have a stripe customer id"
      );
    }

    const listStripeSubscriptionsResponse =
      await this.stripeSubscriptionRepo.listByCustomerId(
        userStripeData.customerId
      );

    return {
      statusCode: 200,
      body: {
        data: {
          subscriptions: listStripeSubscriptionsResponse.data,
        },
        paginationToken: listStripeSubscriptionsResponse.paginationToken,
      },
    };
  }
}
