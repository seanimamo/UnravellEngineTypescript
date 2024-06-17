import Stripe from "stripe";

export interface OLD_IUserStripeInfo {
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
   * The unique stripe customer id. This should map to the UUID for your users.
   */
  customerId: string;
  /**
   * The unqiue user id this object belongs to.
   */
  userId: string;
  /**
   * The custom name of the subscription plan, this is something you set within the stripe dashboard
   * and can be changed.
   */
  subscriptionName: OLD_SubscriptionPlanName;
  /**
   * The id of the Stripe {@link Stripe.Subscription} object.
   * Subscriptions allow you to charge a customer on a recurring basis. Note that a subscription will contain a "Price"
   * object that which will define more of the payment terms.
   *
   * @remarks This is required to support subscription upgrading and downgrading
   * @see https://docs.stripe.com/api/subscriptions
   */
  subscriptionId: string;
  /**
   * The current `status` of the {@link SubscriptionStatus | Stripe Subscription}. This tracks the payment lifecycle of the subscription.
   */
  status: OLD_StripeSubscriptionStatus;
  /**
   * The expiration date of the current subscription period e.g. one month from subsciption day Seconds Epoch time
   */
  expirationDate: number;
  /**
   *  The id of the Stripe {@link Stripe.Price} object.
   *  A "Price" defines the unit cost, currency, and (optional) billing cycle for both recurring and one-time purchases of products
   *  and help you track payment terms.
   *
   * @see https://docs.stripe.com/api/prices
   * @see https://docs.stripe.com/products-prices/how-products-and-prices-work#what-is-a-price
   */
  priceId: string;
}

// export interface IUserStripeSubcription {
//     /**
//      * This is used to prevent concurrent database updates from
//      * clobbering eachother.
//      */
//     objectVersion: number;
//     /**
//      * The unique stripe customer id. This should map to the UUID for your users.
//      */
//     customerId: string;
//     /**
//      * When the subscription was created for the user in epoch seconds
//      */
//     created: number;
//     /**
//      * The end of the current payment cycle for the subscription period in epoch seconds
//      */
//     current_period_end: number;
//     collection_method: Stripe.Subscription.CollectionMethod;
//     /**
//      * The parent subscription object, this can contain multiple subscriptions within it with
//      * each subscription containing one "price" that defines the payment terms
//      */
//     subcription: {
//         id: string;
//         status: StripeSubscriptionStatus;
//         /**
//          * The child subscriptions contained within this parent subscription
//          */
//         subcriptionItems: {
//             /**
//              * Object that defines the payment terms of the subscription item.
//              */
//             price: {
//                 /**
//                  * The ID of the {@link Stripe.Price} object;
//                  */
//                 id: string;
//                 /**
//                  * The ID of the product this price is associated with.
//                  */
//                 productId: string;
//                 /**
//                  * The changeable nickname/display name of the {@link Stripe.Price}
//                  */
//                 nickname: string;
//                 type: Stripe.Price.Type;
//                 /**
//                  * Information
//                  */
//                 recurring?: {
//                     interval: Stripe.Price.Recurring.Interval;
//                     interval_count: number;
//                 };
//                 /**
//                  * The unit amount in cents to be charged, represented as a whole integer if possible.
//                  */
//                 unit_amount: number;
//             };
//         }[];
//     };
// }

export enum OLD_SubscriptionPlanName {
  NONE = "NONE",
  BASE = "Base Tier",
  PREMIUM = "Premium Tier",
}

/**
 * The current status of a Stripe Subscription. This tracks the payment lifecycle of the subscription.
 *
 * @remarks This is a 1:1 mapping of the `status` values from the Stripe API.
 * @see https://docs.stripe.com/api/subscriptions/object#subscription_object-status for more information
 */
export enum OLD_StripeSubscriptionStatus {
  /**
   * When a subscription collection method is set to `charge_automatically`,
   * a subscription moves into `incomplete` if the initial payment attempt fails.
   */
  INCOMPLETE = "incomplete",
  /**
   * If the first invoice is not paid within 23 hours, the subscription transitions to `incomplete_expired`.
   */
  INCOMPLETE_EXPIRED = "incomplete_expired",
  /**
   * A subscription that is currently in a trial period is trialing and moves to `active` when the trial period is over.
   */
  TRIALING = "trialing",
  /**
   * Once the first invoice is paid, the subscription moves into the `active` status.
   */
  ACTIVE = "active",
  /**
   * When a subscription collection method is set to `charge_automatically`,
   * it becomes `past_due` when payment is required but cannot be paid (due to failed payment or awaiting additional user actions).
   */
  PAST_DUE = "past_due",
  /**
   * When a subscription collection method is set to `charge_automatically` and the status becomes `past_due`,
   * Once Stripe has exhausted all payment retry attempts, the subscription will become `canceled` or `unpaid` (depending on your subscriptions settings)
   */
  canceled = "canceled",
  /**
   * See {@link SubscriptionStatus.CANCELED}
   * Note that when a subscription has a status of `unpaid`, no subsequent invoices will be attempted (invoices will be created, but then immediately automatically closed)
   */
  UNPAID = "unpaid",
  /**
   * A subscription can only enter a `paused` status {@link https://docs.stripe.com/billing/subscriptions/trials#create-free-trials-without-payment | when a trial ends without a payment method}.
   * A `paused` subscription doesn’t generate invoices and can be resumed after your customer adds their payment method.
   * The paused status is different from pausing collection, which still generates invoices and leaves the subscription’s status unchanged.
   */
  PAUSED = "paused",
}
