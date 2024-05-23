import { IUserGoogleSignInCreds } from "./IUserGoogleSignInCreds";

export interface IUserGoogleSignInOAuthCredentialsRepo {
    getByUserId(userId: string): Promise<IUserGoogleSignInCreds>;
    getByGmailAddress(address: string): Promise<IUserGoogleSignInCreds>;
    save(credentials: IUserGoogleSignInCreds): Promise<void>;
    update(
        userId: string,
        params: {
            updatedAt?: string;
            refreshToken?: string;
            scopes?: string[];
        }
    ): Promise<any>;
}
