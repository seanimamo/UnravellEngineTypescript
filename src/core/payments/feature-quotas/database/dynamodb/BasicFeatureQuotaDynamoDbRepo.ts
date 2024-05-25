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
import { IFeatureQuota } from "../../../types";
import { IDatabaseResponse, ISerializer } from "../../../../database";
import { IFeatureQuotaRepo } from "../IFeatureQuotaRepo";

/**
 * A basic implementation of {@link IFeatureQuotaRepo} using dynamodb as the database to handle {@link IFeatureQuota} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export abstract class BasicFeatureQuotaDynamoDbRepo
  extends DynamoDbRepository<IFeatureQuota>
  implements IFeatureQuotaRepo
{
  public static DB_IDENTIFIER = "FEATURE_QUOTA";
  #client: DynamoDBClient;

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IFeatureQuota>,
    tableName: string
  ) {
    super(client, serializer, tableName);
    this.#client = client;
  }

  /**
   * Validates the data within an {@link IFeatureQuota} is safe to be persisted to a database.
   */
  abstract validate(featureQuota: IFeatureQuota): void;

  createPartitionKey = (featureQuota: IFeatureQuota) => {
    return featureQuota.id;
  };

  createSortKey = () => {
    return BasicFeatureQuotaDynamoDbRepo.DB_IDENTIFIER;
  };

  async delete(featureQuota: IFeatureQuota) {
    return await super.delete(featureQuota);
  }

  async getById(id: string): Promise<IDatabaseResponse<IFeatureQuota | null>> {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: id,
      sortKey: {
        value: BasicFeatureQuotaDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
    });
  }

  async save(featureQuota: IFeatureQuota) {
    this.validate(featureQuota);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get featureQuota by userId & featureId)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: BasicFeatureQuotaDynamoDbRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([featureQuota.userId, featureQuota.featureId]),
    };

    return await super.saveItem({
      object: featureQuota,
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }

  async listByUserId(userId: string, featureId?: string) {
    const sortKeyParams = [userId];
    if (featureId) {
      sortKeyParams.push(featureId);
    }

    return await super.getItemsByCompositeKey({
      primaryKey: BasicFeatureQuotaDynamoDbRepo.DB_IDENTIFIER,
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
      usage?: number;
      resetDate?: Date;
      unlimitedAccess?: boolean;
    }
  ) {
    return await retryAsyncMethodWithExpBackoffJitter(
      () => this._updateFeatureQuota(id, params),
      10,
      [ConditionalCheckFailedException]
    );
  }

  private async _updateFeatureQuota(
    id: string,
    params: {
      usage?: number;
      resetDate?: Date;
      unlimitedAccess?: boolean;
    }
  ) {
    let getFeatureQuotaResponse = await this.getById(id);
    const featureQuota = getFeatureQuotaResponse.data;
    if (featureQuota === null) {
      throw new ObjectDoesNotExistError("Feature Quota does not exist");
    }

    const updateExpressionCommands = [];
    let expressionNames: Record<string, string> | undefined;
    let expressionAttributeValues: Record<string, AttributeValue> = {};

    if (params.usage !== undefined) {
      updateExpressionCommands.push(`#usageKey = :usageVal`);
      expressionAttributeValues[":usageVal"] = { N: `${params.usage}` };
      // We have to do extra work here to build our update expression because 'usage' is a reserved keyword
      // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
      if (expressionNames === undefined) {
        expressionNames = {
          "#usageKey": "usage",
        };
      } else {
        expressionNames["#usageKey"] = "usage";
      }
    }

    if (updateExpressionCommands.length === 0) {
      throw new InvalidParametersError(
        "Cannot attempt featureQuota update with no changes"
      );
    }

    // This enables optimistic locking.
    updateExpressionCommands.push(`objectVersion = :updatedObjectVersion`);
    expressionAttributeValues[":updatedObjectVersion"] = {
      N: `${featureQuota.objectVersion + 1}`,
    };
    expressionAttributeValues[":currentObjectVersion"] = {
      N: `${featureQuota.objectVersion}`,
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
          S: BasicFeatureQuotaDynamoDbRepo.DB_IDENTIFIER,
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
