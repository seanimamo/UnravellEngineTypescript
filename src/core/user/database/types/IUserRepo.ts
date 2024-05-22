import { IDatabaseResponse } from "../../../database";
import { IUserPassword } from "../../types";
import { IUser } from "../../types/IUser";

/**
 * Interface for saving, retrieving & updating a user in various ways
 */
export interface IUserRepo {
    save(user: IUser): Promise<IDatabaseResponse<any>>;
    delete(user: IUser): Promise<IDatabaseResponse<any>>;
    getById(uuid: string): Promise<IDatabaseResponse<IUser | null>>;
    update(
        uuid: string,
        params: {
            password?: IUserPassword;
            isAccountConfirmed?: boolean;
        } & { [key: string]: any }
    ): Promise<any>;
}
