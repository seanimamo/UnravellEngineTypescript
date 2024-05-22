import {
  AttributeValue,
  ConditionalCheckFailedException,
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { ISerializer } from "../../../../database";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
  KeyFactory,
} from "../../../../database/dynamodb";
import Stripe from "stripe";
import {
  InvalidParametersError,
  ObjectDoesNotExistError,
} from "../../../../database/error";
import { retryAsyncMethodWithExpBackoffJitter } from "../../../../util";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { IStripeSubscriptionRepo } from "../IStripeSubscriptionRepo";
import { IStripeSubscription } from "../../types";

/**
 * A basic implementation of {@link IStripeSubscriptionRepo} saving and modifying user stripe data
 * with dynamodb. This class is designed to work purely off of interfaces which
 * enables it to be highly modular.
 */
export abstract class BasicStripeSubscriptionDynamoDbRepo
  extends DynamoDbRepository<IStripeSubscription>
  implements IStripeSubscriptionRepo
{
  public static DB_IDENTIFIER = `STRIPE_SUBSCRIPTION`;
  /**
   * Enables logic for denormalized data in dynamodb
   * Dernormalizing the data means that other than the keys & GSI's, the rest of the data will be
   * stringified under a single asttribute in Dynamodb which reduces memory as compared to dynamodb JSON.
   */
  private readonly denormalize = true;
  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IStripeSubscription>,
    tableName: string
  ) {
    super(client, serializer, tableName);
  }

  /**
   * Validates the data within an {@link IStripeSubscription} is safe to be persisted to a database.
   */
  abstract validate(stripeSubscription: IStripeSubscription): void;

  createPartitionKey = (stripeSubscription: IStripeSubscription) => {
    return stripeSubscription.customerId;
  };

  createSortKey = (stripeSubscription: IStripeSubscription) => {
    return KeyFactory.create([
      BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
      stripeSubscription.subscription.id,
    ]);
  };

  async save(stripeSubscription: IStripeSubscription) {
    this.validate(stripeSubscription);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get all subscriptions by subscription status, sorted by create date)
    if (stripeSubscription.subscription) {
      gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
        S: BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
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
        denormalize: this.denormalize,
      });
    } catch (error) {
      throw error;
    }
  }

  async getByCustomerAndSubscriptionId(
    customerId: string,
    subscriptionId: string
  ) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: KeyFactory.create([
          BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
          subscriptionId,
        ]),
        conditionExpressionType: "COMPLETE",
      },
      denormalize: this.denormalize,
    });
  }

  async listByCustomerId(customerId: string) {
    return await super.getItemsByCompositeKey({
      primaryKey: customerId,
      sortKey: {
        value: BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "BEGINS_WITH",
      },
      denormalize: this.denormalize,
    });
  }

  async listAllBySubscriptionStatus(status: Stripe.Subscription.Status) {
    return await super.getItemsByCompositeKey({
      primaryKey: BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
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

    const updatedSubscription: IStripeSubscription = {
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
      TableName: process.env.DYNAMO_MAIN_TABLE_NAME!,
      Key: {
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName]: {
          S: customerId,
        },
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName]: {
          S: BasicStripeSubscriptionDynamoDbRepo.DB_IDENTIFIER,
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
