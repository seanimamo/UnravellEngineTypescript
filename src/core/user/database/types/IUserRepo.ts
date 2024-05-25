import { IDatabaseResponse } from "../../../database";
import { IUserPassword } from "../../types";
import { IUser } from "../../types/IUser";

/**
 * Core interface for a database repository that can execute CRUD operations for {@link IUser}'s
 *
 * @remarks - This is designed to be database agnostic, meaning it can be implemented most types of databases.
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
