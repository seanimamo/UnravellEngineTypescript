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
} from "../../../database/error";
import {
  GENERIC_DYNAMODB_INDEXES,
  DynamoDbRepository,
} from "../../../database/dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { retryAsyncMethodWithExpBackoffJitter } from "../../../util";
import { IUser, IUserPassword } from "../../types";
import { IDatabaseResponse, ISerializer } from "../../../database";
import { IUserRepo } from "..";
import { EmailAlreadyInUseError, UsernameAlreadyInUseError } from "../error";

/**
 * A basic implementation of {@link IUserRepo} using dynamodb as the database to handle {@link IUser} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality
 */
export abstract class BasicUserDynamoDbRepo
  extends DynamoDbRepository<IUser>
  implements IUserRepo
{
  public static DB_IDENTIFIER = "USER";
  #client: DynamoDBClient;
  private readonly passwordSerializer: ISerializer<IUserPassword>;

  constructor(
    client: DynamoDBClient,
    userSerializer: ISerializer<IUser>,
    passwordSerializer: ISerializer<IUserPassword>,
    tableName: string
  ) {
    super(client, userSerializer, tableName);
    this.#client = client;
    this.passwordSerializer = passwordSerializer;
  }

  /**
   * Validates the data within an {@link IUser} is safe to be persisted to a database.
   */
  abstract validate(user: IUser): void;

  createPartitionKey = (user: IUser) => {
    return user.id;
  };

  createSortKey = () => {
    return BasicUserDynamoDbRepo.DB_IDENTIFIER;
  };

  async delete(user: IUser) {
    return await super.delete(user);
  }

  async getById(id: string): Promise<IDatabaseResponse<IUser | null>> {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: id,
      sortKey: {
        value: BasicUserDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
    });
  }

  async save(user: IUser) {
    this.validate(user);

    const [existingUserWithUsername, existingUserWithEmail] = await Promise.all(
      [this.getByUsername(user.userName), this.getByEmail(user.email)]
    );

    // Check if a user with the given username already exists
    if (existingUserWithUsername.data !== null) {
      throw new UsernameAlreadyInUseError();
    }

    if (existingUserWithEmail.data !== null) {
      throw new EmailAlreadyInUseError();
    }

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get user by email)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: user.email,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: this.createSortKey(),
    };

    // GSI 2: Get by username
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI2.partitionKeyName}`] = {
      S: user.userName,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI2.sortKeyName}`] = {
      S: this.createSortKey(),
    };

    return await super.saveItem({
      object: user,
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }

  async getByUsername(userName: string) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: userName,
      sortKey: {
        value: BasicUserDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI2,
    });
  }

  async getByEmail(email: string) {
    return await super.getUniqueItemByCompositeKey({
      primaryKey: email,
      sortKey: {
        value: BasicUserDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  async update(
    uuid: string,
    params: {
      firstName?: string;
      lastName?: string;
      password?: IUserPassword;
      isAccountConfirmed?: boolean;
    }
  ) {
    return await retryAsyncMethodWithExpBackoffJitter(
      () => this._updateUser(uuid, params),
      10,
      [ConditionalCheckFailedException]
    );
  }

  private async _updateUser(
    id: string,
    params: {
      firstName?: string;
      lastName?: string;
      password?: IUserPassword;
      isAccountConfirmed?: boolean;
    }
  ) {
    let getUserResponse = await this.getById(id);
    const user = getUserResponse.data;
    if (user === null) {
      throw new ObjectDoesNotExistError("User does not exist");
    }

    const updateExpressionCommands = [];
    let expressionNames = undefined;
    let expressionAttributeValues: Record<string, AttributeValue> = {};
    if (params.firstName !== undefined) {
      updateExpressionCommands.push(`firstName = :firstName`);
      expressionAttributeValues[":firstName"] = { S: params.firstName };
    }
    if (params.lastName !== undefined) {
      updateExpressionCommands.push(`lastName = :lastName`);
      expressionAttributeValues[":lastName"] = { S: params.lastName };
    }
    if (params.password !== undefined) {
      updateExpressionCommands.push(`password = :password`);
      expressionAttributeValues[":password"] = {
        M: marshall(this.passwordSerializer.toJson(params.password)),
      };
    }
    if (params.isAccountConfirmed !== undefined) {
      updateExpressionCommands.push(`isAccountConfirmed = :isAccountConfirmed`);
      expressionAttributeValues[":isAccountConfirmed"] = {
        BOOL: params.isAccountConfirmed,
      };
    }

    if (updateExpressionCommands.length === 0) {
      throw new InvalidParametersError(
        "Cannot attempt user update with no changes"
      );
    }

    // This enables optimistic locking.
    updateExpressionCommands.push(`objectVersion = :updatedObjectVersion`);
    expressionAttributeValues[":updatedObjectVersion"] = {
      N: `${user.objectVersion + 1}`,
    };
    expressionAttributeValues[":currentObjectVersion"] = {
      N: `${user.objectVersion}`,
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
          S: BasicUserDynamoDbRepo.DB_IDENTIFIER,
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
