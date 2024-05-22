/**
 * An object for storying Google OAuth credentials necessary for signing in with google.
 *
 * Storing credentails simplfys returning users who sign in with google since they don't need to
 * restart the process of obtaining a google authorization url from the server, having the users must visit to get an authorizatin code
 * and sending that to the server to get tokens to access their google profile information.
 */
export interface IUserGoogleSignInCreds {
    /**
     * The unique id of the user these credentials belong to
     */
    userId: string;
    /**
     * The gmail address of the user.
     */
    gmailAddress: string;
    /**
     * The google oauth credentials.
     */
    oAuthCredentials: {
        updatedAt: string;
        /**
         * The Google OAuth token that will give access to
         */
        refreshToken: string;
        /**
         * The OAuth scopes these credentials provide access to.
         */
        scopes: string[];
    };
}
