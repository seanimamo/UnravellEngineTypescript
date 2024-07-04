import {
  AttributeValue,
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DeleteItemCommandInput,
  DeleteItemCommandOutput,
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UniqueObjectAlreadyExistsDbError } from "../DatabaseError";
import { PaginatedDynamoDbResponse } from "./PaginatedDynamoDbResponse";
import { IDatabaseResponse, ISerializer } from "..";
import { DynamoDbIndex, GENERIC_DYNAMODB_INDEXES } from "./DynamoDBConstants";

/**
 * Helper class for doing common functionality with AWS DynamoDB.
 */
export class DynamoDbRepoHelper<T extends Record<any, any>> {
  constructor(
    readonly client: DynamoDBClient,
    readonly serializer: ISerializer<T>,
    readonly tableName: string
  ) {}

  /**
   * Marshalls items to DynamoDBJSON so they can be saved to DynamoDB.
   * Can be overriden by child classes
   */
  async toDynamoDBJson(object: T): Promise<Record<string, AttributeValue>> {
    return marshall(this.serializer.toJson(object));
  }

  /**
   * Unmarshalls items from DynamoDBJSON to their original type.
   * Can be overriden by child classes
   */
  async fromDynamoDBJson(object: Record<string, AttributeValue>) {
    return this.serializer.fromJson(unmarshall(object));
  }

  // Saves an item and fails if an object with the same pkey and skey already exist.
  async saveItem(params: {
    object: T;
    partitionKey: string;
    sortKey: string;
    checkForExistingKey: "PRIMARY" | "COMPOSITE" | "NONE";
    extraItemAttributes?: Record<string, AttributeValue>;
    /**
     * Enables logic for compressed data in dynamodb
     * compress the data means that other than the keys & GSI's, the rest of the data will be
     * stringified under a single asttribute in Dynamodb which reduces memory as compared to dynamodb JSON.
     */
    compress?: boolean;
  }): Promise<IDatabaseResponse<PutItemCommandOutput>> {
    const commandParams: PutItemCommandInput = {
      TableName: this.tableName,
      Item: {},
    };

    if (params.compress === true) {
      commandParams.Item!["data"] = {
        S: this.serializer.serialize(params.object),
      };
    } else {
      commandParams.Item = await this.toDynamoDBJson(params.object);
    }

    const primaryKeyName = GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName;
    const sortKeyName = GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName;

    commandParams.Item![primaryKeyName] = {
      S: params.partitionKey,
    };
    commandParams.Item![sortKeyName] = {
      S: params.sortKey,
    };
    if (params.extraItemAttributes) {
      Object.keys(params.extraItemAttributes).forEach((key) => {
        commandParams.Item![key] = params.extraItemAttributes![key];
      });
    }

    if (params.checkForExistingKey === "PRIMARY") {
      commandParams.ConditionExpression = `attribute_not_exists(${primaryKeyName})`;
    } else if (params.checkForExistingKey === "COMPOSITE") {
      commandParams.ConditionExpression = `attribute_not_exists(${primaryKeyName}) and attribute_not_exists(${sortKeyName})`;
    }

    try {
      const response = await this.client.send(
        new PutItemCommand(commandParams)
      );
      return {
        data: response,
      };
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new UniqueObjectAlreadyExistsDbError();
      }
      throw error;
    }
  }

  //   async deleteByObject(
  //     object: T
  //   ): Promise<IDatabaseResponse<DeleteItemCommandOutput>> {
  //     const partitionKey = this.createPartitionKey(object);
  //     const sortKey = this.createSortKey(object);
  //     return await this._delete(partitionKey, sortKey);
  //   }

  async delete(
    partitionKey: string,
    sortKey: string
  ): Promise<IDatabaseResponse<DeleteItemCommandOutput>> {
    const commandInput: DeleteItemCommandInput = {
      TableName: this.tableName,
      Key: {
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName]: {
          S: partitionKey,
        },
        [GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName]: {
          S: sortKey,
        },
      },
      ReturnValues: "ALL_OLD",
    };
    const response = await this.client.send(
      new DeleteItemCommand(commandInput)
    );

    return {
      data: response,
    };
  }

  /**
   * Attempts to retrieve a single unique item using a composite key.
   * @param primaryKey DynamoDB Partition/Primary Key
   * @param sortKey DynamoDB Sort Key, the conditionExpressionType field enables partial match a sort key
   * instead of a complete match (partial match only based on what the sort key begins with.)
   * @returns null if not found, an error if more than 1 of the item is found, or the item if it is found.
   */
  async getUniqueItemByCompositeKey(params: {
    primaryKey: string;
    sortKey?: {
      value: string;
      conditionExpressionType: "BEGINS_WITH" | "COMPLETE";
    };
    index?: DynamoDbIndex;
    compress?: boolean;
    sortDirection?: "ASCENDING" | "DESCENDING";
  }): Promise<IDatabaseResponse<T | null>> {
    const response = await this.getItemsByCompositeKey({
      primaryKey: params.primaryKey,
      sortKey: params.sortKey,
      index: params.index,
      compress: params.compress,
      queryLimit: 2, // query limit still set to 2 to limit number of item retrieved but still trigger error if more than 1 found.
      sortDirection: params.sortDirection,
    });

    if (response.data!.length === 0) {
      return {
        data: null,
      };
    }
    if (response.data!.length > 1) {
      throw new Error("Found more than 1 objects when there should not be");
    }

    return {
      data: response.data[0],
    };
  }

  async getItemsByCompositeKey(params: {
    primaryKey: string;
    sortKey?: {
      value: string;
      conditionExpressionType: "BEGINS_WITH" | "COMPLETE";
    };
    index?: DynamoDbIndex;
    paginationToken?: Record<string, AttributeValue>;
    queryLimit?: number;
    sortDirection?: "ASCENDING" | "DESCENDING";
    compress?: boolean;
  }): Promise<PaginatedDynamoDbResponse<T[]>> {
    const commandParams: QueryCommandInput = {
      TableName: this.tableName,
    };
    // Partition and sortkey default to the primary index but change if an Index is specified.
    let partitionKeyName: string =
      GENERIC_DYNAMODB_INDEXES.PRIMARY.partitionKeyName;
    let sortKeyName: string = GENERIC_DYNAMODB_INDEXES.PRIMARY.sortKeyName;
    if (params.index?.indexName) {
      commandParams.IndexName = params.index!.indexName!;
      partitionKeyName = params.index!.partitionKeyName!;
      sortKeyName = params.index!.sortKeyName!;
    }

    let keyConditionExpression = `${partitionKeyName} = :PkeyValue`;
    let expressionAttributeValues: Record<string, AttributeValue> = {
      ":PkeyValue": { S: params.primaryKey },
    };
    if (params.sortKey) {
      expressionAttributeValues[":SkeyValue"] = {
        S: params.sortKey.value,
      };
      if (params.sortKey.conditionExpressionType === "BEGINS_WITH") {
        keyConditionExpression += ` and begins_with(${sortKeyName}, :SkeyValue)`;
      } else if (params.sortKey.conditionExpressionType === "COMPLETE") {
        keyConditionExpression += ` and ${sortKeyName} = :SkeyValue`;
      }
    }

    commandParams.KeyConditionExpression = keyConditionExpression;
    commandParams.ExpressionAttributeValues = expressionAttributeValues;

    if (params.paginationToken) {
      commandParams.ExclusiveStartKey = params.paginationToken;
    }
    if (params.queryLimit) {
      commandParams.Limit = params.queryLimit;
    }
    if (params.sortDirection) {
      commandParams.ScanIndexForward = params.sortDirection === "ASCENDING";
    }

    const dynamoResponse = await this.client.send(
      new QueryCommand(commandParams)
    );
    const paginatedResponse: PaginatedDynamoDbResponse<T[]> = {
      data: [],
      paginationToken: null,
    };
    paginatedResponse.paginationToken = dynamoResponse.LastEvaluatedKey || null;
    if (params.index) {
      paginatedResponse.queryHint = { index: params.index };
    }
    if (dynamoResponse.Items!.length === 0) {
      return paginatedResponse;
    }

    const marshalledItems: T[] = [];
    dynamoResponse.Items!.forEach(async (item) => {
      let marshalledItem: T;
      if (params.compress === true) {
        marshalledItem = this.serializer.deserialize(item.data.S!);
      } else {
        marshalledItem = await this.fromDynamoDBJson(item);
      }
      marshalledItems.push(marshalledItem);
    });

    paginatedResponse.data = marshalledItems;
    return paginatedResponse;
  }

  /**
   * Create a Dynamodb update expression with consecutive SET commands.
   * each command should be formatted as follows: `myAttributeName := :myAttributeValue` or `#myAttributeName := :myAttributeValue` for reserved key words.
   * @param commands list of partial dynamodb update expressions
   * @returns string DynamoDB UpdateExpression or null if no commands provided.
   */
  protected updateItemExpressionBuilder(commands: string[]) {
    if (commands.length == 0) {
      return null;
    }
    let updateExpression = "SET";
    for (let i = 0; i < commands.length; i++) {
      updateExpression += ` ${commands[i]}`;
      if (i < commands.length - 1) {
        updateExpression += ",";
      }
    }
    return updateExpression;
  }
}
