export interface IUserPassword {
  /**
   * The salt used to generate the password hash
   */
  salt: string;
  /**
   * The password that was hashed using the provided salt
   */
  passwordHash: string;
  isPasswordCorrect(plainTextPassword: string): boolean;
}
