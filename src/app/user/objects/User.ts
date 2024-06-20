import "reflect-metadata"; //required for class transformer to work;
import { UserPassword } from "./UserPassword";
import { UserBanStatus } from "./UserBanStatus";
import { Expose, Type } from "class-transformer";
import { IUser, UserAuthType } from "../../../core/user/types";
import { DataValidator } from "../../../core/util";
import { TransformDate } from "../../../core/database/serialization/class-transform";

/**
 * User account for Unravell.
 */
export class User implements IUser {
  @Expose() objectVersion: number;
  @Expose() userName: string;
  @Expose() id: string;
  @Type(() => UserPassword)
  @Expose()
  password: UserPassword;
  @Expose() email: string;
  @Expose() authType: UserAuthType;
  @Expose() isAccountConfirmed: boolean;
  @Expose() firstName?: string;
  @Expose() lastName?: string;
  @TransformDate()
  @Expose()
  joinDate: Date;
  @Type(() => UserBanStatus)
  @Expose()
  banStatus?: UserBanStatus;

  constructor(params: {
    objectVersion: number | null;
    userName: string;
    id: string;
    password: UserPassword;
    email: string;
    isAccountConfirmed: boolean;
    joinDate: Date;
    authType: UserAuthType;
    firstName?: string;
    lastName?: string;
    banStatus?: UserBanStatus;
  }) {
    if (params.objectVersion === null) {
      this.objectVersion = 1;
    } else {
      this.objectVersion = params.objectVersion;
    }

    this.userName = params.userName;
    this.password = params.password;
    this.id = params.id;
    this.email = params.email;
    this.isAccountConfirmed = params.isAccountConfirmed;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.joinDate = params.joinDate;
    this.authType = params.authType;
    this.banStatus = params.banStatus;
  }

  static validate(user: User) {
    // TODO: Grab validator from singleton source
    const validator: DataValidator = new DataValidator();

    validator
      .validate(user.objectVersion, "objectVersion")
      .notUndefined()
      .notNull()
      .isNumber()
      .notNegative();
    // TODO: add complex more userName format/constraints validation
    validator
      .validate(user.userName, "userName")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();
    validator
      .validate(user.id, "id")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();
    // TODO: add complex user email format validation
    validator
      .validate(user.email, "email")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();
    validator
      .validate(user.authType, "authType")
      .notUndefined()
      .notNull()
      .isString()
      .notEmpty();
    validator
      .validate(user.isAccountConfirmed, "isAccountConfirmed")
      .notUndefined()
      .notNull()
      .isBoolean();
    // TODO: add complex user password format/constraints validation
    validator.validate(user.password, "password").notUndefined().notNull();
    validator
      .validate(user.firstName, "firstName")
      .ifNotUndefined()
      .notNull()
      .isString()
      .notEmpty();
    validator
      .validate(user.lastName, "lastName")
      .ifNotUndefined()
      .notNull()
      .isString()
      .notEmpty();
    validator
      .validate(user.joinDate, "joinDate")
      .notUndefined()
      .notNull()
      .isDate()
      .dateIsNotInFuture();

    if (user.banStatus !== undefined) {
      validator
        .validate(user.banStatus, "banStatus")
        .notNull()
        .isClass(UserBanStatus);
      UserBanStatus.validate(user.banStatus);
    }
  }
}
