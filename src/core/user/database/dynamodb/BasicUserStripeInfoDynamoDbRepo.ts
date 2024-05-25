import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { IUserStripeInfo } from "../../types/IUserStripeInfo";
import { IUserStripeInfoRepo } from "../types/IUserStripeInfoRepo";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
  KeyFactory,
} from "../../../database/dynamodb";
import { ISerializer } from "../../../database";

/**
 * A basic implementation of {@link IUserStripeInfoRepo} using dynamodb as the database to handle {@link IUserStripeInfo} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export abstract class BasicUserStripeInfoDynamoDbRepo
  extends DynamoDbRepository<IUserStripeInfo>
  implements IUserStripeInfoRepo
{
  public static DB_IDENTIFIER = `USER_STRIPE_INFO`;

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IUserStripeInfo>,
    tableName: string
  ) {
    super(client, serializer, tableName);
  }

  /**
   * Validates the data within an {@link IUserStripeInfo} is safe to be persisted to a database.
   */
  abstract validate(userStripeInfo: IUserStripeInfo): void;

  createPartitionKey = (userStripeInfo: IUserStripeInfo) => {
    return userStripeInfo.userId;
  };

  createSortKey = () => {
    return BasicUserStripeInfoDynamoDbRepo.DB_IDENTIFIER;
  };

  async save(userStripeInfo: IUserStripeInfo) {
    this.validate(userStripeInfo);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: Get stripe info by customer id
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: userStripeInfo.customerId,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([
        userStripeInfo.userId,
        BasicUserStripeInfoDynamoDbRepo.DB_IDENTIFIER,
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
        value: BasicUserStripeInfoDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
    });
  }

  async getByCustomerId(customerId: string) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: BasicUserStripeInfoDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }
}
