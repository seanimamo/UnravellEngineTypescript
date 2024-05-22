import Stripe from "stripe";

/**
 * This object is meant to be a cache of a given subscriptions information for a particular
 * customer id. It does not include any application specific information.
 */
export interface IStripeSubscription {
    /**
     * This is used to prevent concurrent database updates from
     * clobbering eachother.
     */
    objectVersion: number;
    /**
     * The Stripe customer Id this subscription belongs to
     */
    customerId: string;
    /**
     * The version of the Stripe API this subcription
     * was recieved from.
     */
    apiVersion: string;
    /**
     * A cached set of users Stripe Subscription data.
     */
    subscription: Stripe.Subscription;
}
