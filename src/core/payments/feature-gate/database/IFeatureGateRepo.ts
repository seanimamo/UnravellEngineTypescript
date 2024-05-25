import {
  IDatabaseResponse,
  IPaginatedDatabaseResponse,
} from "../../../database";
import { IFeatureGate } from "../IFeatureGate";

/**
 * Core interface for a database repository that can execute CRUD operations for {@link IFeatureGate}'s
 *
 * @remarks - This is designed to be database agnostic, meaning it can be implemented most types of databases.
 */
export interface IFeatureGateRepo {
  save(user: IFeatureGate): Promise<IDatabaseResponse<any>>;
  delete(user: IFeatureGate): Promise<IDatabaseResponse<any>>;
  getById(id: string): Promise<IDatabaseResponse<IFeatureGate | null>>;
  /**
   * List {@link IFeatureGate}'s by user id and optionally feature id.
   */
  listByUserId(
    userId: string,
    featureId?: string
  ): Promise<IPaginatedDatabaseResponse<IFeatureGate[]>>;
  update(
    uuid: string,
    params: {
      usage?: number;
      resetDate?: Date;
      unlimitedAccess?: boolean;
    } & { [key: string]: any }
  ): Promise<any>;
}
