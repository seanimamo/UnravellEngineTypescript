import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminDisableUserCommand,
    AdminGetUserCommand,
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * A Wrapper over AWS Cognito fuctions to help simplify and centralize logic.
 */
export class CognitoDao {
    constructor(
        private readonly client: CognitoIdentityProviderClient,
        private readonly userPoolId: string,
        /**
         * The cognito user pool client id (not the same as the user pool id)
         */
        private readonly clientId: string
    ) {}

    /**
     * Signs up a user to a given Cognito user pool.
     *
     * @see - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/command/SignUpCommand/
     *
     * @remarks - Unlike the 'Admin' version of this method, its from the perspective of a user
     * so you provide a password. In contrast, the 'Admin' version can only set a temp password
     * @remarks - cognito also supports user context data like ip addresses with this request, and we can connect to an analytics endppoint
     */
    public async signUp(username: string, password: string, email: string) {
        const input = {
            ClientId: this.clientId, // required
            Username: username, // required
            Password: password, // required
            UserAttributes: [
                // AttributeListType
                {
                    // AttributeType
                    Name: "email", // required
                    Value: email,
                },
            ],
        };
        const command = new SignUpCommand(input);
        return await this.client.send(command);
    }

    /**
     * Confirms sign up of a given user using a confirmation code.
     *
     * @see - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/command/ConfirmSignUpCommand/
     *
     * @remarks - cognito also supports user context data like ip addresses with this request, and we can connect to an analytics endppoint
     */
    public async confirmSignUp(confirmationCode: string, username: string) {
        const input = {
            // ConfirmSignUpRequest
            ClientId: this.clientId, // required
            Username: username, // required
            ConfirmationCode: confirmationCode, // required
            ForceAliasCreation: false,
            //   UserContextData: { // UserContextDataType
            //     IpAddress: "STRING_VALUE",
            //     EncodedData: "STRING_VALUE",
            //   },
        };
        const command = new ConfirmSignUpCommand(input);
        return await this.client.send(command);
    }

    /**
     * Deletes user as an Admin, meaning you don't need the users password.
     * @remarks Unlike the Cognito UI, you don't need to disable the users account first.
     */
    public async adminDeleteUser(username: string) {
        const input = {
            // AdminDeleteUserRequest
            UserPoolId: this.userPoolId, // required
            Username: username, // required
        };
        const command = new AdminDeleteUserCommand(input);
        return await this.client.send(command);
    }

    public async forgotPassword(username: string) {
        const input = {
            // ForgotPasswordRequest
            ClientId: this.clientId, // required
            Username: username, // required
            // UserContextData: {
            //     // UserContextDataType
            //     IpAddress: "STRING_VALUE",
            //     EncodedData: "STRING_VALUE",
            // },
            // AnalyticsMetadata: {
            //     // AnalyticsMetadataType
            //     AnalyticsEndpointId: "STRING_VALUE",
            // },
            // ClientMetadata: {
            //     // ClientMetadataType
            //     "<keys>": "STRING_VALUE",
            // },
        };
        const command = new ForgotPasswordCommand(input);
        return await this.client.send(command);
    }

    public async confirmForgotPassword(
        username: string,
        confirmationCode: string,
        newPassword: string
    ) {
        const input = {
            ClientId: this.clientId, // required
            Username: username, // required
            ConfirmationCode: confirmationCode, // required
            Password: newPassword, // required
            // AnalyticsMetadata: { // AnalyticsMetadataType
            //   AnalyticsEndpointId: "STRING_VALUE",
            // },
            // UserContextData: { // UserContextDataType
            //   IpAddress: "STRING_VALUE",
            //   EncodedData: "STRING_VALUE",
            // },
            // ClientMetadata: { // ClientMetadataType
            //   "<keys>": "STRING_VALUE",
            // },
        };
        const command = new ConfirmForgotPasswordCommand(input);
        return await this.client.send(command);
    }

    public async adminGetUser(username: string) {
        const input = {
            UserPoolId: this.userPoolId, // required
            Username: username, // required
        };
        const command = new AdminGetUserCommand(input);
        return await this.client.send(command);
    }
}
