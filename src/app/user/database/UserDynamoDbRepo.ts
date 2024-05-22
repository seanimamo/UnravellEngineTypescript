import { BasicUserDynamoDbRepo } from "../../../core/user/database/dynamodb";
import { IUserRepo } from "../../../core/user/database/types";
import { User } from "../objects";

export class UserDynamoDbRepo
    extends BasicUserDynamoDbRepo
    implements IUserRepo
{
    /**
     * Validates the data within an {@link User} is safe to be persisted to a database.
     */
    validate(user: User): void {
        User.validate(user);
    }
}
