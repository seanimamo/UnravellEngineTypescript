import { IUserPassword } from ".";

/**
 * The base interface for users within the core system.
 */
export interface IUser {
    /**
     * The users username, this should be unique but changeable.
     */
    userName: string;
    /**
     * The id for the user, this should be unique and UNchangeable.
     */
    id: string;
    /**
     * The users email address
     */
    email: string;
    password: IUserPassword;
    isAccountConfirmed: boolean;
    authType: UserAuthType;
    /**
     * This is used to prevent concurrent database updates from
     * clobbering eachother.
     */
    objectVersion: number;
}

/**
 * The different types of authentication the user account could use.
 */
export const USER_AUTH_TYPES = {
    INTERNAL: "internal",
    GOOGLE: "google",
} as const;

/**
 * The typescript type for values from {@link USER_AUTH_TYPES}
 */
export type UserAuthType =
    (typeof USER_AUTH_TYPES)[keyof typeof USER_AUTH_TYPES];
