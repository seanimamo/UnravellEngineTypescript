import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { IStripeUserDataRepo } from "../IStripeUserDataRepo";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
  KeyFactory,
} from "../../../../../database/dynamodb";
import { ISerializer } from "../../../../../database";
import { IStripeUserData } from "../../IStripeUserData";
import { DataValidator } from "../../../../../util";

/**
 * A basic implementation of {@link IStripeUserDataRepo} using dynamodb as the database to handle {@link IStripeUserData} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export class BasicStripeUserDataDynamoDbRepo
  extends DynamoDbRepository<IStripeUserData>
  implements IStripeUserDataRepo
{
  public static DB_IDENTIFIER = `USER_STRIPE_DATA`;

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IStripeUserData>,
    tableName: string
  ) {
    super(client, serializer, tableName);
  }

  /**
   * Validates the data within an {@link IStripeUserData} is safe to be persisted to a database.
   *
   * @Remarks you should override this if you are using an object that extends {@link IStripeUserData}
   */
  validate(userStripeInfo: IStripeUserData): void {
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

  createPartitionKey = (userStripeInfo: IStripeUserData) => {
    return userStripeInfo.userId;
  };

  createSortKey = () => {
    return BasicStripeUserDataDynamoDbRepo.DB_IDENTIFIER;
  };

  async save(userStripeInfo: IStripeUserData) {
    this.validate(userStripeInfo);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: Get stripe info by customer id
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: userStripeInfo.customerId,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([
        userStripeInfo.userId,
        BasicStripeUserDataDynamoDbRepo.DB_IDENTIFIER,
      ]),
    };

    return await super.saveItem({
      object: userStripeInfo,
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }

  async getByUserId(userId: string) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: userId,
      sortKey: {
        value: BasicStripeUserDataDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
    });
  }

  async getByCustomerId(customerId: string) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: BasicStripeUserDataDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }
}
