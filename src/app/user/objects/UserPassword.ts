import "reflect-metadata"; //required for class transformer to work;
import * as bcrypt from "bcryptjs";
import { Expose } from "class-transformer";
import { IUserPassword } from "../../../core/user/types";

export class UserPassword implements IUserPassword {
    static saltRounds = 10;
    @Expose() salt: string;
    @Expose() passwordHash: string;

    constructor(salt: string, passwordHash: string) {
        this.salt = salt;
        this.passwordHash = passwordHash;
    }

    static fromPlainTextPassword(plainTextPassword: string) {
        const salt = bcrypt.genSaltSync(UserPassword.saltRounds);
        const passwordHash = bcrypt.hashSync(plainTextPassword, salt);
        return new UserPassword(salt, passwordHash);
    }

    isPasswordCorrect(plainTextPassword: string) {
        return bcrypt.compareSync(plainTextPassword, this.passwordHash);
    }
}
