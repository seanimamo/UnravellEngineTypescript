export interface IUserPassword {
    /**
     * One way encrypted password.
     */
    passwordHash: string;
    isPasswordCorrect(plainTextPassword: string): boolean;
}
