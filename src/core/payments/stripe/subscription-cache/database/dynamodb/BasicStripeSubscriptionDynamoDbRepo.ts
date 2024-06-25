import {
  AttributeValue,
  ConditionalCheckFailedException,
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { ISerializer } from "../../../../../database";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
  KeyFactory,
} from "../../../../../database/dynamodb";
import Stripe from "stripe";
import {
  InvalidParametersError,
  ObjectDoesNotExistError,
} from "../../../../../database/error";
import { retryAsyncMethodWithExpBackoffJitter } from "../../../../../util";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IStripeSubscriptionCacheRepo } from "../../IStripeSubscriptionCacheRepo";
import { IStripeSubscriptionCache } from "../../IStripeSubscriptionCache";

/**
 * A basic implementation of {@link IStripeSubscriptionCacheRepo} using dynamodb as the database to handle {@link IStripeSubscriptionCache} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export abstract class BasicStripeSubscriptionCacheDynamoDbRepo
  extends DynamoDbRepository<IStripeSubscriptionCache>
  implements IStripeSubscriptionCacheRepo
{
  public static DB_IDENTIFIER = `STRIPE_SUBSCRIPTION_CACHE`;
  /**
   * Enables logic for compressed data in dynamodb
   * compress the data means that other than the keys & GSI's, the rest of the data will be
   * stringified under a single asttribute in Dynamodb which reduces memory as compared to dynamodb JSON.
   */
  private readonly compress: boolean;
  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IStripeSubscriptionCache>,
    tableName: string,
    compress: boolean
  ) {
    super(client, serializer, tableName);
    this.compress = compress;
  }

  /**
   * Validates the data within an {@link IStripeSubscriptionCache} is safe to be persisted to a database.
   */
  validate(stripeSubscription: IStripeSubscriptionCache): void {}

  createPartitionKey = (stripeSubscription: IStripeSubscriptionCache) => {
    return stripeSubscription.customerId;
  };

  createSortKey = (stripeSubscription: IStripeSubscriptionCache) => {
    return KeyFactory.create([
      BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
      stripeSubscription.subscription.id,
    ]);
  };

  async save(stripeSubscription: IStripeSubscriptionCache) {
    this.validate(stripeSubscription);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get all subscriptions by subscription status, sorted by create date)
    if (stripeSubscription.subscription) {
      gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
        S: BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
      };
      gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
        S: KeyFactory.create([
          stripeSubscription.subscription.status,
          stripeSubscription.subscription.created,
        ]),
      };
    }

    try {
      return await super.saveItem({
        object: stripeSubscription,
        checkForExistingKey: "COMPOSITE",
        extraItemAttributes: gsiAttributes,
        compress: this.compress,
      });
    } catch (error) {
      throw error;
    }
  }

  async getByCustomerAndSubscriptionId(
    customerId: string,
    subscriptionId?: string
  ) {
    const sortKeyParams = [
      BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
    ];

    if (subscriptionId !== undefined) {
      sortKeyParams.push(subscriptionId);
    }

    return await super.getUniqueItemByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: KeyFactory.create(sortKeyParams),
        conditionExpressionType: "BEGINS_WITH",
      },
      compress: this.compress,
    });
  }

  async listByCustomerId(customerId: string) {
    return await super.getItemsByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
      compress: this.compress,
    });
  }

  async listAllBySubscriptionStatus(status: Stripe.Subscription.Status) {
    return await super.getItemsByCompositeKey({
      primaryKey: BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
      sortKey: {
        value: status,
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  async update(
    customerId: string,
    updates: {
      apiVersion: string;
      subscription: Stripe.Subscription;
    }
  ) {
    return await retryAsyncMethodWithExpBackoffJitter(
      () => this._update(customerId, updates),
      10,
      [ConditionalCheckFailedException]
    );
  }

  private async _update(
    customerId: string,
    updates: {
      apiVersion: string;
      subscription: Stripe.Subscription;
    }
  ) {
    const getLatestStripeInfoResponse =
      await this.getByCustomerAndSubscriptionId(
        customerId,
        updates.subscription.id
      );
    const latestStripeInfo = getLatestStripeInfoResponse.data;
    if (!latestStripeInfo) {
      throw new ObjectDoesNotExistError(
        "Cannot update customer stripe data that does not exist"
      );
    }
    const currentObjectVersion = latestStripeInfo!.objectVersion;

    const updateExpressionCommands = [];
    let expressionNames: Record<string, string> | undefined;
    let expressionAttributeValues: Record<string, AttributeValue> = {};

    const updatedSubscription: IStripeSubscriptionCache = {
      ...latestStripeInfo,
      apiVersion: updates.apiVersion,
      subscription: updates.subscription,
    };

    // Stripe subscription data is denormalized under one attribute called 'data'
    updateExpressionCommands.push(`data = :data`);
    expressionAttributeValues[":data"] = {
      S: this.serializer.serialize(updatedSubscription),
    };

    // If the status of the subcription changes we need to update GSI Partition key for status
    if (latestStripeInfo.subscription.status !== updates.subscription.status) {
      updateExpressionCommands.push(
        `${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName} = :gsi1PartitionKey`
      );
      expressionAttributeValues[":gsi1PartitionKey"] = {
        S: `${updates.subscription.status}`,
      };
    }

    if (updateExpressionCommands.length === 0) {
      throw new InvalidParametersError(
        "Cannot attempt userStripeSubscription update with no changes"
      );
    }

    // This enables optimistic locking.
    updateExpressionCommands.push(`objectVersion = :updatedObjectVersion`);
    expressionAttributeValues[":updatedObjectVersion"] = {
      N: `${currentObjectVersion! + 1}`,
    };
    expressionAttributeValues[":currentObjectVersion"] = {
      N: `${currentObjectVersion}`,
    };

    const updateExpression = this.updateItemExpressionBuilder(
      updateExpressionCommands
    );
    const updateParams: UpdateItemCommandInput = {
      TableName: this.tableName,
      Key: {
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName]: {
          S: customerId,
        },
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName]: {
          S: BasicStripeSubscriptionCacheDynamoDbRepo.DB_IDENTIFIER,
        },
      },
      ConditionExpression: `objectVersion = :currentObjectVersion`,
      UpdateExpression: updateExpression!,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionNames,
      ReturnValues: "ALL_NEW",
    };

    const response = await this.client.send(
      new UpdateItemCommand(updateParams)
    );
    return this.serializer.fromJson(unmarshall(response.Attributes!));
  }
}
