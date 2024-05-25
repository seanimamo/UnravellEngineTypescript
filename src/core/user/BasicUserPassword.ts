import * as bcrypt from "bcryptjs";
import { IUserPassword } from "./types";

/**
 * A basic implementation of {@link IUserPassword}
 */
export class BasicUserPassword implements IUserPassword {
  private static saltRounds = 10;
  readonly salt: string;
  readonly passwordHash: string;

  constructor(salt: string, passwordHash: string) {
    this.salt = salt;
    this.passwordHash = passwordHash;
  }

  /**
   * Create a BasicUserPassword using the raw plain text password.
   */
  static fromPlainTextPassword(plainTextPassword: string) {
    const salt = bcrypt.genSaltSync(BasicUserPassword.saltRounds);
    const passwordHash = bcrypt.hashSync(plainTextPassword, salt);
    return new BasicUserPassword(salt, passwordHash);
  }

  /**
   * Given a user password, regenerate the password hash and see if the plaintext passworrod
   */
  isPasswordCorrect(plainTextPassword: string) {
    return bcrypt.compareSync(plainTextPassword, this.passwordHash);
  }
}
