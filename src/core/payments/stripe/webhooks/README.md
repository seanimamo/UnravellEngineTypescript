# Understanding Stripe

## The Typical SAAS Subscription model breakdown

A Stripe `Subscription` contains one or more "prices". A `Price` define the unit cost, currency, and (optional) billing cycle for both recurring and one-time purchases of products. For example, your "Basic Tier" `Subscription` may contain a monthly and a yearly `Price`. You'd probably expect your users to only buy one of the `Price`'s within your `Subcription`.

[Subscriptions overview on stripe](https://docs.stripe.com/billing/subscriptions/overview)
[Checkout how to create this model on Stripe](https://docs.stripe.com/products-prices/pricing-models#flat-rate)

# Stripe Webhooks

This folder covers the various webhooks we have implemented.
See the [Stripe webhook docs](https://docs.stripe.com/api/webhook_endpoints/create) for more info.

## Setting up Stripe webhooks

In order to setup stripe webhooks you must have the following prerequisites

-   An API with an endpoint that can recieve webhook events
-   A stripe developer account where you can manage what webhook events fire as well as your product pricing setup.

## New Customer Subscription Webhook Event

This [webhook event](<(https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#event_types-customer.subscription.created)>) occurs whenever a customer is signed up for a new plan.

-   Stripe webhook event name: "customer.subscription.created"
-   Webhook payload "data.object" shape: [subscription](https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#subscription_object)

## Customer Subscription Deleted Webhook Event

This [webhook event](<(https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#event_types-customer.subscription.deleted)>) occurs whenever a customer’s subscription ends.

-   Stripe webhook event name: "customer.subscription.deleted"
-   Webhook payload "data.object" shape: [subscription](https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#subscription_object)

## Customer Subscription Updated Webhook Event

This [webhook event](<(https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#event_types-customer.subscription.updated)>) occurs whenever a subscription changes (e.g., switching from one plan to another, or changing the status from trial to active).

-   Stripe webhook event name: "customer.subscription.updated"
-   Webhook payload "data.object" shape: [subscription](https://docs.stripe.com/api/events/types?event_types-invoice.payment_succeeded=#subscription_object)
