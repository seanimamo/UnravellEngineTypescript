import Stripe from "stripe";
import { IStripeSubscriptionCache } from "../subscription-cache";
import {
  IDatabaseResponse,
  IPaginatedDatabaseResponse,
} from "../../../database";

/**
 * Repository for caching stripe subscriptions information
 *
 * @see IStripeSubscription
 * @see IStripeSubscriptionRepo
 */
export interface IStripeSubscriptionCacheRepo {
  save(
    userStripeSubscription: IStripeSubscriptionCache
  ): Promise<IDatabaseResponse<any>>;

  getByCustomerAndSubscriptionId(
    userId: string,
    subscriptionId: string
  ): Promise<IDatabaseResponse<IStripeSubscriptionCache | null>>;

  /**
   * List all stripe subscriptions by customer id
   * @param id The Stripe Customer Id
   */
  listByCustomerId(
    customerId: string
  ): Promise<IPaginatedDatabaseResponse<IStripeSubscriptionCache[]>>;

  /**
   * Lists all subscriptions across all users by {@link Stripe.Subscription.Status}
   */
  listAllBySubscriptionStatus(
    status: Stripe.Subscription.Status
  ): Promise<IPaginatedDatabaseResponse<IStripeSubscriptionCache[]>>;

  update(
    customerId: string,
    updates: {
      subscription: Stripe.Subscription;
    } & { [key: string]: any }
  ): Promise<any>;
}
