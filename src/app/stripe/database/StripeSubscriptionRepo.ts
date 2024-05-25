import { BasicStripeSubscriptionCacheDynamoDbRepo } from "../../../core/payments/stripe/subscription-cache/database";
import { IStripeSubscriptionCache } from "../../../core/payments/stripe/subscription-cache";

export class StripeSubscriptionRepo extends BasicStripeSubscriptionCacheDynamoDbRepo {
  // TODO: Implement this
  validate(stripeSubscriptionCache: IStripeSubscriptionCache): void {
    return;
  }
}
