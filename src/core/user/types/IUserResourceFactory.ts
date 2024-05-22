import { IUser, UserAuthType } from "./IUser";
import { IUserPassword, IUserStripeInfo } from ".";
import { ISerializer } from "../../database";
import { IUserRepo, IUserStripeInfoRepo } from "../database/types";

/**
 * The factory is responsible for providing concrete implementations of classes/interfaces
 * required for common manipulation of an {@link IUser}.
 */
export interface IUserResourceFactory {
    /**
     * Creates an instance of IUser object.
     * @remarks This should contain application specific logic.
     */
    createUser(params: {
        id?: string;
        textPassword?: string;
        email?: string;
        authType?: UserAuthType;
        firstName?: string;
        lastName?: string;
    }): IUser;

    /**
     * Creates an instance of IUserPassword object.
     * @remarks This should contain application specific logic.
     */
    createUserPassword(plainTextPassword: string): IUserPassword;

    getUserSerializer(): ISerializer<IUser>;
    getUserPasswordSerializer(): ISerializer<IUserPassword>;
    getUserStripeInfoSerializer(): ISerializer<IUserStripeInfo>;

    getUserRepo(): IUserRepo;
    getUserStripeInfoRepo(): IUserStripeInfoRepo;
}
