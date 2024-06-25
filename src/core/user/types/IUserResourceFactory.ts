import { IUser, UserAuthType } from "./IUser";
import { IUserPassword } from ".";
import { ISerializer } from "../../database";
import { IUserRepo } from "../database";
import { IStripeUserData } from "../../payments/stripe/user-data";
import { IStripeUserDataRepo } from "../../payments/stripe/user-data/database";

/**
 * The factory is responsible for providing concrete implementations of classes/interfaces
 * required for common manipulation of an {@link IUser}.
 */
export interface IUserResourceFactory {
  /**
   * Creates an instance of IUser object.
   * @remarks This should contain application specific logic.
   */
  createUser(
    params: {
      id?: string;
      textPassword?: string;
      email?: string;
      authType?: UserAuthType;
    } & Record<string, unknown>
  ): IUser;

  /**
   * Creates an instance of IUserPassword object.
   * @remarks This should contain application specific logic.
   */
  createUserPassword(plainTextPassword: string): IUserPassword;

  getUserSerializer(): ISerializer<IUser>;
  getUserPasswordSerializer(): ISerializer<IUserPassword>;
  getUserStripeDataSerializer(): ISerializer<IStripeUserData>;

  getUserRepo(): IUserRepo;
  getUserStripeDataRepo(): IStripeUserDataRepo;
}
