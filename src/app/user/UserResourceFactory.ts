import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ClassSerializer } from "../../core/database/serialization/ClassSerializer";
import {
  IUserResourceFactory,
  IUserPassword,
  IUserStripeInfo,
  IUser,
  UserAuthType,
} from "../../core/user/types";
import { UserDynamoDbRepo } from "./database/UserDynamoDbRepo";
import { ISerializer, NaiveJsonSerializer } from "../../core/database";
import { UserStripeInfoDynamoDbRepo } from "./database/UserStripeInfoDynamoDbRepo";
import { User, UserPassword } from "./objects";
import { AWS_INFRA_CONFIG } from "../infrastructure/aws/cdk/config";

/**
 * Implementation of {@link IUserResourceFactory} for Unravell.
 * @remarks
 */
export class UserResourceFactory implements IUserResourceFactory {
  private static USER_SERIALIZER = new ClassSerializer(User);
  private static PASSWORD_SERIALIZER = new ClassSerializer(UserPassword);
  private static USER_STRIPE_INFO_SERIALIZER =
    new NaiveJsonSerializer<IUserStripeInfo>();
  /**
   * Dynamodb table name for users.
   */
  private static USER_REPO_TABLE_NAME =
    AWS_INFRA_CONFIG.database.tables.user.tableName;
  /**
   * Dynamodb table name for user stripe info. (It get stored in the same table as users.)
   */
  private static USER_STRIPE_INFO_TABLE_NAME =
    UserResourceFactory.USER_REPO_TABLE_NAME;

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

  getUserStripeInfoSerializer(): ISerializer<IUserStripeInfo> {
    return UserResourceFactory.USER_STRIPE_INFO_SERIALIZER;
  }

  getUserRepo() {
    return new UserDynamoDbRepo(
      this.dbClient,
      UserResourceFactory.USER_SERIALIZER,
      UserResourceFactory.PASSWORD_SERIALIZER,
      UserResourceFactory.USER_REPO_TABLE_NAME
    );
  }

  getUserStripeInfoRepo() {
    return new UserStripeInfoDynamoDbRepo(
      this.dbClient,
      UserResourceFactory.USER_STRIPE_INFO_SERIALIZER,
      UserResourceFactory.USER_STRIPE_INFO_TABLE_NAME
    );
  }
}
