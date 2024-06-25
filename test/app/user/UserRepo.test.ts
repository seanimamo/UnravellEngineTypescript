import "dotenv/config";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { UserRepo } from "../../../src/app/user/database/UserRepo";
import { UserResourceFactory } from "../../../src/app/user/UserResourceFactory";
import { User, UserPassword } from "../../../src/app/user/objects";
import { USER_AUTH_TYPES } from "../../../src/core/user/types";
import { startDb, stopDb, createTables, deleteTables } from "jest-dynalite";
import {
  EmailAlreadyInUseError,
  UsernameAlreadyInUseError,
} from "../../../src/core/user/database/dynamodb/BasicUserDynamoDbRepo";

let v3Client: DynamoDBClient;
let userResourceFactory: UserResourceFactory;
const testUserProps = {
  objectVersion: 1,
  email: "email@gmail.com",
  id: "1234",
  userName: "1234",
  password: UserPassword.fromPlainTextPassword("password"),
  authType: USER_AUTH_TYPES.INTERNAL,
  firstName: "sean",
  lastName: "imam",
  isAccountConfirmed: false,
  joinDate: new Date(),
};
jest.setTimeout(1000000);

beforeAll(async () => {
  await startDb();

  v3Client = new DynamoDBClient({
    region: "local",
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT, // special setup for jest-dynalite.
  });

  userResourceFactory = new UserResourceFactory(
    v3Client,
    "UserTable" // the name of the table we set in jest-dyanlite-config.js
  );
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

describe("UserRepo", () => {
  test(".save() runs successfully", async () => {
    const userRepo = userResourceFactory.getUserRepo();
    await userRepo.save(
      new User(
        1,
        testUserProps.id,
        testUserProps.id,
        testUserProps.password,
        testUserProps.email,
        testUserProps.isAccountConfirmed,
        testUserProps.joinDate,
        testUserProps.authType,
        testUserProps.firstName,
        testUserProps.lastName
      )
    );
  });

  test(".save() fails to save a user with the same username", async () => {
    const userRepo = userResourceFactory.getUserRepo();
    await userRepo.save(
      new User(
        1,
        testUserProps.id,
        testUserProps.id,
        testUserProps.password,
        testUserProps.email,
        testUserProps.isAccountConfirmed,
        testUserProps.joinDate,
        testUserProps.authType,
        testUserProps.firstName,
        testUserProps.lastName
      )
    );

    await expect(
      userRepo.save(
        new User(
          1,
          "aDifferentId",
          testUserProps.id,
          testUserProps.password,
          "aDifferentEmail@gmail.com",
          testUserProps.isAccountConfirmed,
          testUserProps.joinDate,
          testUserProps.authType,
          testUserProps.firstName,
          testUserProps.lastName
        )
      )
    ).rejects.toThrow(UsernameAlreadyInUseError);
  });

  test(".save() fails to save a user with the same email", async () => {
    const userRepo = userResourceFactory.getUserRepo();
    await userRepo.save(
      new User(
        1,
        testUserProps.id,
        testUserProps.id,
        testUserProps.password,
        testUserProps.email,
        testUserProps.isAccountConfirmed,
        testUserProps.joinDate,
        testUserProps.authType,
        testUserProps.firstName,
        testUserProps.lastName
      )
    );

    await expect(
      userRepo.save(
        new User(
          1,
          "aDifferentId",
          "aDifferentUsername",
          testUserProps.password,
          testUserProps.email,
          testUserProps.isAccountConfirmed,
          testUserProps.joinDate,
          testUserProps.authType,
          testUserProps.firstName,
          testUserProps.lastName
        )
      )
    ).rejects.toThrow(EmailAlreadyInUseError);
  });
});
