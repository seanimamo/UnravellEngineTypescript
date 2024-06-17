import { ISubscription } from "../types";

/**
 * Core interface for Stripe subscriptions, built on top of the generic {@link ISubscription}
 */
export interface IStripeSubscription extends ISubscription {
  paymentProcessor: "STRIPE";
  /**
   * The external id for the customer maintained on stripe's end.
   */
  customerId: string;
  /**
   * The id of the 'Price' object belonging to this subscription.
   * A 'Price' in Stripe is the object that determines how a subscription is billed.
   */
  priceId: string;
  // TODO: Find out if stripe subscription can have multiple inner subscription items.
}
