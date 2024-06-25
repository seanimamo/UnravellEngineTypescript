import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ClassSerializer } from "../../core/database/serialization/ClassSerializer";
import {
  IUserResourceFactory,
  IUserPassword,
  IUser,
  UserAuthType,
} from "../../core/user/types";
import { UserRepo } from "./database/UserRepo";
import { ISerializer, NaiveJsonSerializer } from "../../core/database";
import { User, UserPassword } from "./objects";
import { BasicStripeUserDataDynamoDbRepo } from "../../core/payments/stripe/user-data/database/dynamodb";
import { IStripeUserData } from "../../core/payments/stripe/user-data";

/**
 * Implementation of {@link IUserResourceFactory} for Unravell.
 * @remarks
 */
export class UserResourceFactory implements IUserResourceFactory {
  private static USER_SERIALIZER = new ClassSerializer(User);
  private static PASSWORD_SERIALIZER = new ClassSerializer(UserPassword);
  private static STRIPE_USER_DATA_SERIALIZER =
    new NaiveJsonSerializer<IStripeUserData>();

  private readonly userTableName: string;

  constructor(
    private readonly dbClient: DynamoDBClient,
    userTableName?: string
  ) {
    this.dbClient = dbClient;
    this.userTableName = userTableName ?? process.env.USER_DB_TABLE_NAME!;
  }

  /**
   *
   * @remarks The username is created from the email, Most apps do not need standalone usernames at this time but we keep it around for future use.
   */
  createUser(params: {
    id: string;
    textPassword: string;
    email: string;
    authType: UserAuthType;
    firstName: string;
    lastName: string;
  }): User {
    const user = new User(
      1,
      params.id,
      params.id,
      UserPassword.fromPlainTextPassword(params.textPassword),
      params.email,
      false,
      new Date(),
      params.authType,
      params.firstName,
      params.lastName
    );
    return user;
  }

  createUserPassword(plainTextPassword: string): IUserPassword {
    return UserPassword.fromPlainTextPassword(plainTextPassword);
  }

  getUserSerializer(): ISerializer<IUser> {
    return UserResourceFactory.USER_SERIALIZER;
  }

  getUserPasswordSerializer(): ISerializer<IUserPassword> {
    return UserResourceFactory.PASSWORD_SERIALIZER;
  }

  getUserStripeDataSerializer(): ISerializer<IStripeUserData> {
    return UserResourceFactory.STRIPE_USER_DATA_SERIALIZER;
  }

  getUserRepo() {
    return new UserRepo(
      this.dbClient,
      UserResourceFactory.USER_SERIALIZER,
      UserResourceFactory.PASSWORD_SERIALIZER,
      this.userTableName!
    );
  }

  getUserStripeDataRepo() {
    return new BasicStripeUserDataDynamoDbRepo(
      this.dbClient,
      UserResourceFactory.STRIPE_USER_DATA_SERIALIZER,
      // Dynamodb table name for user stripe info is stored in the same table as users.)
      this.userTableName!
    );
  }
}
