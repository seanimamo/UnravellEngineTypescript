import {
  AttributeValue,
  ConditionalCheckFailedException,
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  InvalidParametersError,
  ObjectDoesNotExistError,
} from "../../../../database/error";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
  KeyFactory,
} from "../../../../database/dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { retryAsyncMethodWithExpBackoffJitter } from "../../../../util";
import { ISubscription, SubscriptionStatus } from "../../types";
import { IDatabaseResponse, ISerializer } from "../../../../database";
import { ISubscriptionRepo } from "../ISubscriptionRepo";

/**
 * A basic implementation of {@link ISubscriptionRepo} using dynamodb as the database to handle {@link ISubscription} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export abstract class BasicSubscriptionDynamoDbRepo
  extends DynamoDbRepository<ISubscription>
  implements ISubscriptionRepo
{
  public static DB_IDENTIFIER = "SUBSCRIPTION";
  #client: DynamoDBClient;

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<ISubscription>,
    tableName: string
  ) {
    super(client, serializer, tableName);
    this.#client = client;
  }

  /**
   * Validates the data within an {@link ISubscription} is safe to be persisted to a database.
   */
  abstract validate(subscription: ISubscription): void;

  createPartitionKey = (subscription: ISubscription) => {
    return subscription.id;
  };

  createSortKey = () => {
    return BasicSubscriptionDynamoDbRepo.DB_IDENTIFIER;
  };

  async delete(subscription: ISubscription) {
    return await super.delete(subscription);
  }

  async getById(id: string): Promise<IDatabaseResponse<ISubscription | null>> {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: id,
      sortKey: {
        value: BasicSubscriptionDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
    });
  }

  async save(subscription: ISubscription) {
    this.validate(subscription);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get subscription by userId & status)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: BasicSubscriptionDynamoDbRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([
        subscription.userId,
        subscription.status,
        subscription.id,
      ]),
    };

    return await super.saveItem({
      object: subscription,
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }

  async listByUserId(userId: string, subscriptionStatus?: SubscriptionStatus) {
    const sortKeyParams = [userId];
    if (subscriptionStatus) {
      sortKeyParams.push(subscriptionStatus);
    }

    return await super.getItemsByCompositeKey({
      primaryKey: BasicSubscriptionDynamoDbRepo.DB_IDENTIFIER,
      sortKey: {
        value: KeyFactory.create(sortKeyParams),
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  async update(
    id: string,
    params: {
      status?: SubscriptionStatus;
    }
  ) {
    return await retryAsyncMethodWithExpBackoffJitter(
      () => this._updateSubscription(id, params),
      10,
      [ConditionalCheckFailedException]
    );
  }

  private async _updateSubscription(
    id: string,
    params: {
      status?: SubscriptionStatus;
    }
  ) {
    let getSubscriptionResponse = await this.getById(id);
    const subscription = getSubscriptionResponse.data;
    if (subscription === null) {
      throw new ObjectDoesNotExistError("Subscription does not exist");
    }

    const updateExpressionCommands = [];
    let expressionNames: Record<string, string> | undefined;
    let expressionAttributeValues: Record<string, AttributeValue> = {};

    if (params.status !== undefined) {
      updateExpressionCommands.push(`#statusKey = :statusVal`);
      expressionAttributeValues[":statusVal"] = { S: params.status };
      // We have to do extra work here to build our update expression because 'status' is a reserved keyword
      if (expressionNames === undefined) {
        expressionNames = {
          "#statusKey": "status",
        };
      } else {
        expressionNames["#statusKey"] = "status";
      }
    }

    if (updateExpressionCommands.length === 0) {
      throw new InvalidParametersError(
        "Cannot attempt subscription update with no changes"
      );
    }

    // This enables optimistic locking.
    updateExpressionCommands.push(`objectVersion = :updatedObjectVersion`);
    expressionAttributeValues[":updatedObjectVersion"] = {
      N: `${subscription.objectVersion + 1}`,
    };
    expressionAttributeValues[":currentObjectVersion"] = {
      N: `${subscription.objectVersion}`,
    };

    const updateExpression = this.updateItemExpressionBuilder(
      updateExpressionCommands
    );
    const updateParams: UpdateItemCommandInput = {
      TableName: this.tableName,
      Key: {
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName]: {
          S: id,
        },
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName]: {
          S: BasicSubscriptionDynamoDbRepo.DB_IDENTIFIER,
        },
      },
      ConditionExpression: `objectVersion = :currentObjectVersion`,
      UpdateExpression: updateExpression!,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: "ALL_NEW",
    };

    const response = await this.#client.send(
      new UpdateItemCommand(updateParams)
    );
    return this.serializer.fromJson(unmarshall(response.Attributes!));
  }
}
