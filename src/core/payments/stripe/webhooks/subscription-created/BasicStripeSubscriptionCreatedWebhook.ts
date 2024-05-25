import Stripe from "stripe";
import { IStripeSubscriptionCacheRepo } from "../../subscription-cache/database";
import { IStripeSubscriptionCreatedWebhook } from ".";

/**
 * An implementation of {@link IStripeSubscriptionCreatedWebhook} that purely uses generic types
 * enabling it to be highly flexible with your apps specific implementations.
 * This webhook handles the stripe subscription created webhook and primarly serves to cache this data to our backend
 * The event fires whenever a customers subscription is updated.
 */
export class BasicStripeSubscriptionCreatedWebhook
  implements IStripeSubscriptionCreatedWebhook
{
  constructor(
    private readonly stripeSubscriptionCacheRepo: IStripeSubscriptionCacheRepo
  ) {}

  async handleEvent(event: Stripe.Event) {
    // This is the expected event type. This guarentees our type cast of
    // event.data.object to be of type Stripe.Subscription
    if (event.type !== "customer.subscription.created") {
      throw new Error(`Unexpected Stripe event type: ${event.type}`);
    }

    const newSubscription: Stripe.Subscription = event.data
      .object as Stripe.Subscription;

    // This may be unecessary but it guarentees we're working with the Stripe.Subscription object.
    if (newSubscription.object !== "subscription") {
      throw new Error(
        `Unexpected inner stripe event object ${newSubscription.object}`
      );
    }

    // Types suggest subscription.customer could be string | Stripe.Customer | Stripe.DeletedCustomer, so we handle all cases.
    let customerId: string;
    if (typeof newSubscription.customer !== "string") {
      customerId = newSubscription.customer.id;
    } else {
      customerId = newSubscription.customer;
    }

    let existingStripeSubsciption;

    try {
      existingStripeSubsciption =
        await this.stripeSubscriptionCacheRepo.getByCustomerAndSubscriptionId(
          customerId,
          newSubscription.id
        );
    } catch (error) {
      console.error(
        `Failed to get customer stripe subscription from database for stripe customer id ${customerId}`,
        error
      );
    }

    if (existingStripeSubsciption) {
      console.error(
        "Unexpectedly found an existing customer subscription in the database. Overwriting existing subscription. Existing subscription:",
        existingStripeSubsciption
      );

      const databaseResponse = await this.stripeSubscriptionCacheRepo.update(
        customerId,
        {
          subscription: newSubscription,
        }
      );

      console.log("Successfully updated user subscription", databaseResponse);
    } else {
      // TODO: Replace this with a factory for creating the object so people can extend IStripeSubscription
      const databaseResponse = await this.stripeSubscriptionCacheRepo.save({
        objectVersion: 1,
        apiVersion: event.api_version!,
        customerId: customerId,
        subscription: newSubscription,
      });

      console.log(
        "Successfully saved new customer subscription",
        databaseResponse
      );
    }
  }
}
