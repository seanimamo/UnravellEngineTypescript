import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDbRepository } from "../../../database/dynamodb";
import { IUserGoogleSignInCreds } from "./IUserGoogleSignInCreds";
import { ISerializer } from "../../../database";
import { IUserGoogleSignInOAuthCredentialsRepo } from "./IUserGoogleSignInCredsRepo";

// TODO: Complete this class
export abstract class BasicUserGoogleSignInCredsDynamoDbRepo
    extends DynamoDbRepository<IUserGoogleSignInCreds>
    implements IUserGoogleSignInOAuthCredentialsRepo
{
    public static DB_IDENTIFIER = "USER_GOOGLE_OAUTH_SIGNIN_CREDS";

    constructor(
        client: DynamoDBClient,
        userSerializer: ISerializer<IUserGoogleSignInCreds>,
        /**
         * The name of the Dynamodb Table this object is stored in.
         */
        tableName: string
    ) {
        super(client, userSerializer, tableName);
    }

    /**
     * Validates the data within an {@link IUser} is safe to be persisted to a database.
     */
    abstract validate(creds: IUserGoogleSignInCreds): void;

    createPartitionKey = (creds: IUserGoogleSignInCreds) => {
        return creds.userId;
    };

    createSortKey = () => {
        return BasicUserGoogleSignInCredsDynamoDbRepo.DB_IDENTIFIER;
    };

    getByUserId(userId: string): Promise<IUserGoogleSignInCreds> {
        throw new Error("Method not implemented.");
    }
    getByGmailAddress(address: string): Promise<IUserGoogleSignInCreds> {
        throw new Error("Method not implemented.");
    }
    save(credentials: IUserGoogleSignInCreds): Promise<void> {
        throw new Error("Method not implemented.");
    }
    update(
        userId: string,
        params: {
            updatedAt?: string | undefined;
            refreshToken?: string | undefined;
            scopes?: string[] | undefined;
        }
    ): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
