import {
  IDatabaseResponse,
  IPaginatedDatabaseResponse,
} from "../../../database";
import { IFeatureQuota } from "../IFeatureQuota";

/**
 * Core interface for a database repository that can execute CRUD operations for {@link IFeatureQuota}'s
 *
 * @remarks - This is designed to be database agnostic, meaning it can be implemented most types of databases.
 */
export interface IFeatureQuotaRepo {
  save(user: IFeatureQuota): Promise<IDatabaseResponse<any>>;
  delete(user: IFeatureQuota): Promise<IDatabaseResponse<any>>;
  getById(id: string): Promise<IDatabaseResponse<IFeatureQuota | null>>;
  /**
   * List {@link IFeatureQuota}'s by user id and optionally feature id.
   */
  listByUserId(
    userId: string,
    featureId?: string
  ): Promise<IPaginatedDatabaseResponse<IFeatureQuota[]>>;
  update(
    uuid: string,
    params: {
      usage?: number;
      resetDate?: Date;
      unlimitedAccess?: boolean;
    } & { [key: string]: any }
  ): Promise<any>;
}
