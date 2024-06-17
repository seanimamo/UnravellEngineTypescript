import { BasicUserDynamoDbRepo } from "../../../core/user/database/dynamodb";
import { User } from "../objects";

export class UserRepo extends BasicUserDynamoDbRepo {
  /**
   * Validates the data within an {@link User} is safe to be persisted to a database.
   */
  validate(user: User): void {
    User.validate(user);
  }
}
