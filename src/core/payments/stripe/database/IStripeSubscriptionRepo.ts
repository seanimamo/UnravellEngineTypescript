import Stripe from "stripe";
import { IStripeSubscription } from "../types";
import {
    IDatabaseResponse,
    IPaginatedDatabaseResponse,
} from "../../../database";

/**
 * Repository for caching stripe subcsription information
 *
 * @see IStripeSubscription
 * @see IStripeSubscriptionRepo
 */
export interface IStripeSubscriptionRepo {
    save(
        userStripeSubscription: IStripeSubscription
    ): Promise<IDatabaseResponse<any>>;

    getByCustomerAndSubscriptionId(
        userId: string,
        subscriptionId: string
    ): Promise<IDatabaseResponse<IStripeSubscription | null>>;

    /**
     * List all stripe subscriptions by customer id
     * @param id The Stripe Customer Id
     */
    listByCustomerId(
        customerId: string
    ): Promise<IPaginatedDatabaseResponse<IStripeSubscription[]>>;

    /**
     * Lists all subscriptions across all users by {@link Stripe.Subscription.Status}
     */
    listAllBySubscriptionStatus(
        status: Stripe.Subscription.Status
    ): Promise<IPaginatedDatabaseResponse<IStripeSubscription[]>>;

    update(
        customerId: string,
        updates: {
            subscription: Stripe.Subscription;
        } & { [key: string]: any }
    ): Promise<any>;
}
