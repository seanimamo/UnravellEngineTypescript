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
import { IDatabaseResponse, ISerializer } from "../../../../database";
import { IFeatureGateRepo } from "../IFeatureGateRepo";
import { IFeatureGate } from "../../IFeatureGate";

/**
 * A basic implementation of {@link IFeatureGateRepo} using dynamodb as the database to handle {@link IFeatureGate} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality.
 */
export abstract class BasicFeatureGateDynamoDbRepo
  extends DynamoDbRepository<IFeatureGate>
  implements IFeatureGateRepo
{
  public static DB_IDENTIFIER = "FEATURE_GATE";
  #client: DynamoDBClient;

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IFeatureGate>,
    tableName: string
  ) {
    super(client, serializer, tableName);
    this.#client = client;
  }

  /**
   * Validates the data within an {@link IFeatureGate} is safe to be persisted to a database.
   */
  abstract validate(featureGate: IFeatureGate): void;

  createPartitionKey = (featureGate: IFeatureGate) => {
    return featureGate.id;
  };

  createSortKey = () => {
    return BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER;
  };

  async delete(featureGate: IFeatureGate) {
    return await super.delete(featureGate);
  }

  async getById(id: string): Promise<IDatabaseResponse<IFeatureGate | null>> {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: id,
      sortKey: {
        value: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
    });
  }

  async save(featureGate: IFeatureGate) {
    this.validate(featureGate);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get featureGate by userId & featureId)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([featureGate.userId, featureGate.featureName]),
    };

    // GSI2: List by parent type and id
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI2.partitionKeyName}`] = {
      S: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI12.sortKeyName}`] = {
      S: KeyFactory.create([
        featureGate.parent.type,
        featureGate.parent.id,
        featureGate.userId,
        featureGate.featureName,
      ]),
    };

    return await super.saveItem({
      object: featureGate,
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }

  async listByUserId(userId: string, featureName?: string) {
    const sortKeyParams = [userId];
    if (featureName) {
      sortKeyParams.push(featureName);
    }

    return await super.getItemsByCompositeKey({
      primaryKey: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
      sortKey: {
        value: KeyFactory.create(sortKeyParams),
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  async listByParentId(
    parentType: string,
    parentId?: string,
    userId?: string,
    featureName?: string
  ) {
    const sortKeyParams = [parentType];
    if (parentId) {
      sortKeyParams.push(parentId);
    }
    if (userId) {
      sortKeyParams.push(userId);
    }
    if (featureName) {
      sortKeyParams.push(featureName);
    }

    return await super.getItemsByCompositeKey({
      primaryKey: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
      sortKey: {
        value: KeyFactory.create(sortKeyParams),
        conditionExpressionType: "BEGINS_WITH",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI2,
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
      () => this._updateFeatureGate(id, params),
      10,
      [ConditionalCheckFailedException]
    );
  }

  private async _updateFeatureGate(
    id: string,
    params: {
      usage?: number;
      resetDate?: Date;
      unlimitedAccess?: boolean;
    }
  ) {
    let getFeatureGateResponse = await this.getById(id);
    const featureGate = getFeatureGateResponse.data;
    if (featureGate === null) {
      throw new ObjectDoesNotExistError("Feature Gate does not exist");
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
        "Cannot attempt featureGate update with no changes"
      );
    }

    // This enables optimistic locking.
    updateExpressionCommands.push(`objectVersion = :updatedObjectVersion`);
    expressionAttributeValues[":updatedObjectVersion"] = {
      N: `${featureGate.objectVersion + 1}`,
    };
    expressionAttributeValues[":currentObjectVersion"] = {
      N: `${featureGate.objectVersion}`,
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
          S: BasicFeatureGateDynamoDbRepo.DB_IDENTIFIER,
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
