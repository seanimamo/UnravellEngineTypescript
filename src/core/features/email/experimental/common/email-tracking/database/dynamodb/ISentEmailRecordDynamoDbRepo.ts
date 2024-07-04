import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ISentEmailRecord } from "../../ISentEmailRecord";
import { ISerializer } from "@/core/database/serialization";
import {
  DynamoDbRepoHelper,
  GENERIC_DYNAMODB_INDEXES,
  KeyFactory,
  PaginatedDynamoDbResponse,
} from "@/core/database/dynamodb";
import { z } from "zod";
import { InvalidDataDbError } from "@/core/database";
import { combineZodErrorMessages } from "@/core/util";
import { ISentEmailRecordRepo } from "../../ISentEmailRecordRepo";
/**
 * A basic implementation of {@link ISentEmailRecordRepo} using dynamodb as the database to handle {@link ISentEmailRecord} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality
 */
export class SentEmailRecordRepo implements ISentEmailRecordRepo {
  public static DB_IDENTIFIER = "SENT_EMAIL_RECORD";
  private repoHelper: DynamoDbRepoHelper<ISentEmailRecord>;

  /**
   * The Zod package schema for validating an ${@link ISentEmailRecord}
   * @remarks change this if you're using an object with more attributes that need validation
   * than just the base ISentEmailRecord
   */
  private validationSchema = z.object({
    email: z.string().email(),
    createDate: z.date(),
  });

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<ISentEmailRecord>,
    tableName: string
  ) {
    this.repoHelper = new DynamoDbRepoHelper(client, serializer, tableName);
  }

  /**
   * Validates the data within an {@link ISentEmailRecord} is safe to be persisted to a database.
   */
  validate(sentEmailRecord: ISentEmailRecord) {
    const result = this.validationSchema.safeParse(sentEmailRecord);

    if (!result.success) {
      let errorMessage =
        "Unexpected ISentEmailRecord data validation error(s): " +
        combineZodErrorMessages(result.error);

      console.info(errorMessage, result.error);
      throw new InvalidDataDbError(errorMessage);
    }
  }

  createPartitionKey = (sentEmailRecord: ISentEmailRecord) => {
    return sentEmailRecord.id;
  };

  createSortKey = () => {
    return SentEmailRecordRepo.DB_IDENTIFIER;
  };

  /**
   * Delete sent email record by id
   */
  async delete(id: string) {
    return await this.repoHelper.delete(id, SentEmailRecordRepo.DB_IDENTIFIER);
  }

  /**
   * List all SentEmailRecord's by recipient email address, sorted by create date.
   */
  async listByEmail(params: {
    email: string;
    pagination: {
      maxResults?: number;
      pageToken?: Record<string, AttributeValue>;
    };
  }): Promise<PaginatedDynamoDbResponse<ISentEmailRecord[]>> {
    return await this.repoHelper.getItemsByCompositeKey({
      primaryKey: params.email,
      sortKey: {
        value: SentEmailRecordRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
      queryLimit: params.pagination.maxResults,
      paginationToken: params.pagination.pageToken,
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  /**
   * List all SentEmailRecord's, sorted by create date.
   */
  async listAll(params: {
    pagination: {
      maxResults?: number;
      pageToken?: Record<string, AttributeValue>;
    };
  }): Promise<PaginatedDynamoDbResponse<ISentEmailRecord[]>> {
    return await this.repoHelper.getItemsByCompositeKey({
      primaryKey: SentEmailRecordRepo.DB_IDENTIFIER,
      queryLimit: params.pagination.maxResults,
      paginationToken: params.pagination.pageToken,
      index: GENERIC_DYNAMODB_INDEXES.GSI1,
    });
  }

  async save(sentEmailRecord: ISentEmailRecord) {
    this.validate(sentEmailRecord);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get SentEmailRecords by email, sorted by sentDate)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: sentEmailRecord.recipientEmail,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([
        SentEmailRecordRepo.DB_IDENTIFIER,
        sentEmailRecord.sentDate,
        sentEmailRecord.id,
      ]),
    };

    // GSI2: Get ALL SentEmailRecords, sorted by created date
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI2.partitionKeyName}`] = {
      S: SentEmailRecordRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI2.sortKeyName}`] = {
      S: KeyFactory.create([sentEmailRecord.sentDate, sentEmailRecord.id]),
    };

    return await this.repoHelper.saveItem({
      object: sentEmailRecord,
      partitionKey: this.createPartitionKey(sentEmailRecord),
      sortKey: this.createSortKey(),
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }
}
