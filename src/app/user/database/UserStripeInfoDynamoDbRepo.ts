import { DataValidator } from "../../../core/util";
import { BasicUserStripeInfoDynamoDbRepo } from "../../../core/user/database/dynamodb";
import { IUserStripeInfoRepo } from "../../../core/user/database/types";
import { UserStripeInfo } from "../objects";

export class UserStripeInfoDynamoDbRepo
  extends BasicUserStripeInfoDynamoDbRepo
  implements IUserStripeInfoRepo
{
  /**
   * Validates the data within an {@link User} is safe to be persisted to a database.
   */
  validate(userStripeInfo: UserStripeInfo): void {
    const validator: DataValidator = new DataValidator();

    validator
      .validate(userStripeInfo.customerId, "userStripeInfo.customerId")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();

    validator
      .validate(userStripeInfo.userId, "userStripeInfo.userId")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();
  }
}
