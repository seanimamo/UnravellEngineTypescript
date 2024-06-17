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
import { AWS_INFRA_CONFIG } from "../infrastructure/aws/cdk/config";
import { BasicStripeUserDataDynamoDbRepo } from "../../core/payments/stripe/user-data/database/dynamodb";
import { IStripeUserData } from "../../core/payments/stripe/user-data";

/**
 * Implementation of {@link IUserResourceFactory} for Unravell.
 * @remarks
 */
export class UserResourceFactory implements IUserResourceFactory {
  private static USER_SERIALIZER = new ClassSerializer(User);
  private static PASSWORD_SERIALIZER = new ClassSerializer(UserPassword);
  private static STRIPE_USER__DATA_SERIALIZER =
    new NaiveJsonSerializer<IStripeUserData>();
  /**
   * Dynamodb table name for users.
   */
  private static USER_REPO_TABLE_NAME =
    AWS_INFRA_CONFIG.database.tables.user.tableName;

  constructor(private readonly dbClient: DynamoDBClient) {
    this.dbClient = dbClient;
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
    firstName?: string;
    lastName?: string;
  }): User {
    const user = User.builder({
      objectVersion: 1,
      userName: params.email.split("@")[0],
      id: params.id,
      password: UserPassword.fromPlainTextPassword(params.textPassword),
      email: params.email,
      authType: params.authType,
      isAccountConfirmed: false,
      joinDate: new Date(),
      firstName: params.firstName,
      lastName: params.lastName,
    });
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
    return UserResourceFactory.STRIPE_USER__DATA_SERIALIZER;
  }

  getUserRepo() {
    return new UserRepo(
      this.dbClient,
      UserResourceFactory.USER_SERIALIZER,
      UserResourceFactory.PASSWORD_SERIALIZER,
      UserResourceFactory.USER_REPO_TABLE_NAME
    );
  }

  getUserStripeDataRepo() {
    return new BasicStripeUserDataDynamoDbRepo(
      this.dbClient,
      UserResourceFactory.STRIPE_USER__DATA_SERIALIZER,
      // Dynamodb table name for user stripe info is stored in the same table as users.)
      UserResourceFactory.USER_REPO_TABLE_NAME
    );
  }
}
