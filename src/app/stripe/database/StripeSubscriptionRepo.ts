import { BasicStripeSubscriptionDynamoDbRepo } from "../../../core/payments/stripe/database";
import { IStripeSubscription } from "../../../core/payments/stripe/types";

export class StripeSubscriptionRepo extends BasicStripeSubscriptionDynamoDbRepo {
    // TODO: Implement this
    validate(stripeSubscription: IStripeSubscription): void {
        return;
    }
}
