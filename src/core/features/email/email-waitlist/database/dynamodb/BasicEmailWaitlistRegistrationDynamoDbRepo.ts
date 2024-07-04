import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { IEmailWaitlistRegistration } from "../../IEmailWaitlistRegistration";
import { IEmailWaitlistRegistrationRepo } from "../../IEmailWaitlistRegistrationRepo";
import { ISerializer } from "@/core/database/serialization";
import { IDatabaseResponse } from "@/core/database";
import {
  DynamoDbRepoHelper,
  GENERIC_DYNAMODB_INDEXES,
  KeyFactory,
} from "@/core/database/dynamodb";
import { z } from "zod";
import { InvalidDataDbError } from "@/core/database";
import { combineZodErrorMessages } from "@/core/util";
/**
 * A basic implementation of {@link IEmailWaitlistRegistrationRepo} using dynamodb as the database to handle {@link IEmailWaitlistRegistration} data.
 *
 * @remarks Because this class is designed to work purely off of interfaces it can be easily extended to handle more functionality
 */
export class BasicEmailWaitlistRegistrationDynamoDbRepo
  implements IEmailWaitlistRegistrationRepo
{
  public static DB_IDENTIFIER = "EMAIL_WAITLIST_REGISTRATION";
  private repoHelper: DynamoDbRepoHelper<IEmailWaitlistRegistration>;

  /**
   * The Zod package schema for validating an ${@link IEmailWaitlistRegistration}
   * @remarks change this if you're using an object with more attributes that need validation
   * than just the base IEmailWaitlistRegistration
   */
  private validationSchema = z.object({
    email: z.string().email(),
    createDate: z.date(),
  });

  constructor(
    client: DynamoDBClient,
    serializer: ISerializer<IEmailWaitlistRegistration>,
    tableName: string
  ) {
    this.repoHelper = new DynamoDbRepoHelper(client, serializer, tableName);
  }

  /**
   * Validates the data within an {@link IEmailWaitlistRegistration} is safe to be persisted to a database.
   */
  validate(registration: IEmailWaitlistRegistration) {
    const result = this.validationSchema.safeParse(registration);

    if (!result.success) {
      let errorMessage =
        "Unexpected IEmailWaitlistRegistration data validation error(s): " +
        combineZodErrorMessages(result.error);

      console.info(errorMessage, result.error);
      throw new InvalidDataDbError(errorMessage);
    }
  }

  createPartitionKey = (registration: IEmailWaitlistRegistration) => {
    return registration.email;
  };

  createSortKey = () => {
    return BasicEmailWaitlistRegistrationDynamoDbRepo.DB_IDENTIFIER;
  };

  async delete(email: string) {
    return await this.repoHelper.delete(
      email,
      BasicEmailWaitlistRegistrationDynamoDbRepo.DB_IDENTIFIER
    );
  }

  async getByEmail(
    email: string
  ): Promise<IDatabaseResponse<IEmailWaitlistRegistration | null>> {
    return await this.repoHelper.getUniqueItemByCompositeKey({
      primaryKey: email,
      sortKey: {
        value: BasicEmailWaitlistRegistrationDynamoDbRepo.DB_IDENTIFIER,
        conditionExpressionType: "COMPLETE",
      },
    });
  }

  async save(registration: IEmailWaitlistRegistration) {
    this.validate(registration);

    const gsiAttributes: Record<string, AttributeValue> = {};

    // GSI1: (Get registrations by date)
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.partitionKeyName}`] = {
      S: BasicEmailWaitlistRegistrationDynamoDbRepo.DB_IDENTIFIER,
    };
    gsiAttributes[`${GENERIC_DYNAMODB_INDEXES.GSI1.sortKeyName}`] = {
      S: KeyFactory.create([registration.createDate]),
    };

    return await this.repoHelper.saveItem({
      object: registration,
      partitionKey: this.createPartitionKey(registration),
      sortKey: this.createSortKey(),
      checkForExistingKey: "COMPOSITE",
      extraItemAttributes: gsiAttributes,
    });
  }
}
