import Stripe from "stripe";
import { IStripeSubscriptionCreatedWebhook } from ".";
import { ISubscriptionRepo } from "../../../database/ISubscriptionRepo";
import {
  PaymentProcessorType,
  PaymentPlanBillingType,
} from "../../../../types";
import { SubscriptionStatus } from "../../../types";
import { IStripeUserDataRepo } from "../../../../../stripe/user-data/database";
import { IStripeSubscription } from "../../IStripeSubscription";

/**
 * An implementation of {@link IStripeSubscriptionCreatedWebhook} that purely uses generic types
 * enabling it to be highly flexible with your apps specific implementations.
 * This webhook handles the stripe subscription created webhook and primarly serves to cache this data to our backend
 * The event fires whenever a customers subscription is updated.
 */
export abstract class BasicStripeSubscriptionCreatedWebhook
  implements IStripeSubscriptionCreatedWebhook
{
  constructor(
    private readonly stripeSubscriptionRepo: ISubscriptionRepo,
    private readonly stripeUserDataRepo: IStripeUserDataRepo
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

    const newSubscriptionItem: Stripe.SubscriptionItem =
      newSubscription.items.data[0];
    if (!newSubscriptionItem) {
      throw new Error(
        "Stripe subscription unexpectedly does not have an inner Stripe subscription items."
      );
    } else if (newSubscription.items.data.length > 1) {
      throw new Error(
        "Stripe subscription unexpectedly has multiple inner Stripe subscription items."
      );
    }

    // Types suggest subscription.customer could be string | Stripe.Customer | Stripe.DeletedCustomer, so we handle all cases.
    let customerId: string;
    if (typeof newSubscription.customer !== "string") {
      customerId = newSubscription.customer.id;
    } else {
      customerId = newSubscription.customer;
    }

    const userStripeData = await this.stripeUserDataRepo.getByCustomerId(
      customerId
    );
    if (userStripeData === null) {
      throw new Error(
        `Customer with id ${customerId} unexpectedly does not have any cooresponding stripe user data.`
      );
    }

    const subscription: IStripeSubscription = {
      id: newSubscription.id,
      objectVersion: 1,
      billingType: PaymentPlanBillingType.SUBSCRIPTION,
      paymentProcessor: PaymentProcessorType.STRIPE,
      userId: userStripeData.data!.userId,
      displayName: newSubscriptionItem.price.nickname!,
      customerId: customerId,
      priceId: newSubscriptionItem.price.id,
      startDate: new Date(), // TODO: CHANGE THIS!!@@ Date from epoch
      endDate: new Date(), //  // TODO: CHANGE THIS!!@@
      status: SubscriptionStatus.ACTIVE,
    };

    // TODO: Replace this with a factory for creating the object so people can extend IStripeSubscription
    const databaseResponse = await this.stripeSubscriptionRepo.save(
      subscription
    );

    await this.createFeatureGates(subscription);

    console.log(
      "Successfully saved new customer subscription",
      databaseResponse
    );
  }

  /**
   * Create new feature gates, if any, for the given subscription.
   *
   * @remarks Feature gates are used to control the level of access a user has to a given feature.
   * @remarks You probably want specific feature gates for each tier of your applications subscription
   */
  abstract createFeatureGates(subcription: IStripeSubscription): Promise<any>;
}
