import Stripe from "stripe";

/**
 * Core interface for the stripe "New subscription created" webhook
 * @see {@link https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#event_types-customer.subscription.updated}
 * @see {@link BasicStripeSubscriptionCreatedWebhook}
 */
export interface IStripeSubscriptionUpdatedWebhook {
    /**
     * Handles the incoming newly created subscription. It's important to note that the subscription object
     * is available from within the raw webhook `event` object at `event.data.object`.
     *
     * @param subscription A newly created subscription
     */
    handleEvent(event: Stripe.Event): Promise<unknown>;
}
