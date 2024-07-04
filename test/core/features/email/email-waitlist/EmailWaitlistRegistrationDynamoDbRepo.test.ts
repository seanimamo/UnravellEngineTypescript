import "dotenv/config";
import "reflect-metadata"; //required for class transformer to work;
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { startDb, stopDb, createTables, deleteTables } from "jest-dynalite";
import { IEmailWaitlistRegistration } from "../../../../../src/core/features/email/email-waitlist/IEmailWaitlistRegistration";
import { BasicEmailWaitlistRegistrationDynamoDbRepo } from "../../../../../src/core/features/email/email-waitlist/";
import { ClassSerializer } from "@/core/database/serialization";
import {
  InvalidDataDbError,
  UniqueObjectAlreadyExistsDbError,
} from "@/core/database";
import { Expose } from "class-transformer";
import { TransformDate } from "@/core/database/serialization/class-transform";

let v3Client: DynamoDBClient;
let dbRepo: BasicEmailWaitlistRegistrationDynamoDbRepo;

class TestEmailWaitlistRegistration implements IEmailWaitlistRegistration {
  @Expose()
  email: string;

  @Expose()
  @TransformDate()
  createDate: Date;

  constructor(email: string, createDate: Date) {
    this.email = email;
    this.createDate = createDate;
  }
}

const serializer = new ClassSerializer(TestEmailWaitlistRegistration);

class TestDbRepo extends BasicEmailWaitlistRegistrationDynamoDbRepo {
  validate(registration: IEmailWaitlistRegistration): void {
    return;
  }
}

jest.setTimeout(1000000);
beforeAll(async () => {
  await startDb();

  v3Client = new DynamoDBClient({
    region: "local",
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT, // special setup for jest-dynalite.
  });

  dbRepo = new TestDbRepo(v3Client, serializer, "EmailWaitlistRegistration");
});

beforeEach(async () => {
  await createTables();
});

afterEach(async () => {
  await deleteTables();
});

afterAll(async () => {
  await v3Client.destroy();
  await stopDb();
});

describe("EmailWaitlistRegistrationDynamoDbRepo", () => {
  const testRegistration = new TestEmailWaitlistRegistration(
    "test@gmail.com",
    new Date()
  );

  test(".save() runs successfully", async () => {
    await dbRepo.save(testRegistration);
  });

  test(".save() fails to save a registration with the same email", async () => {
    await dbRepo.save(testRegistration);

    await expect(dbRepo.save(testRegistration)).rejects.toThrow(
      UniqueObjectAlreadyExistsDbError
    );
  });

  test(".save() fails to save an invalid registration ", async () => {
    testRegistration.email = "malformedEmailAddress";

    await expect(dbRepo.save(testRegistration)).rejects.toThrow(
      InvalidDataDbError
    );
  });

  test(".getByEmail() runs successfully", async () => {
    await dbRepo.save(testRegistration);
    const res = await dbRepo.getByEmail(testRegistration.email);
    expect(res.data).toEqual(testRegistration);
  });

  test(".delete() successfully deletes an object", async () => {
    await dbRepo.save(testRegistration);
    await dbRepo.delete(testRegistration.email);
    const res = await dbRepo.getByEmail(testRegistration.email);
    expect(res.data).toBeNull();
  });
});
