import { BasicSubscriptionDynamoDbRepo } from "../../database/dynamodb/BasicSubscriptionDynamoDbRepo";
import { IStripeSubscription } from "../IStripeSubscription";

export class BasicStripeSubscriptionDynamoDbRepo extends BasicSubscriptionDynamoDbRepo<IStripeSubscription> {
  validate(subscription: IStripeSubscription): void {
    return; // TODO: Add basic validation here.
  }
}
