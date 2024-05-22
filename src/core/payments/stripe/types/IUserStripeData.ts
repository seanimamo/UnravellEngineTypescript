import Stripe from "stripe";

export interface IUserStripeData {
    /**
     * This is used to prevent concurrent database updates from
     * clobbering eachother.
     */
    objectVersion: number;
    /**
     * The unique id for the object
     */
    uuid: string;
    /**
     * The UUID of the user this belongs to for your users.
     */
    userId: string;
    /**
     * A cached set of users Stripe Subscription data.
     */
    subscription?: IStripeDataCache<Stripe.Subscription>;
}

/**
 * A set of cached Stripe data.
 */
export interface IStripeDataCache<T> {
    /**
     * Date the Stripe subcription was last updated.
     */
    lastUpdated: number;
    /**
     * The API version of Stripe used when the data was recorded.
     */
    api_version: string;
    data: T;
}
