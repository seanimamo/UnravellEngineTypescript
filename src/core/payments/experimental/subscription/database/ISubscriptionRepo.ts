import {
  IDatabaseResponse,
  IPaginatedDatabaseResponse,
} from "../../../../database";
import { ISubscription, SubscriptionStatus } from "../types";

/**
 * Core interface for a database repository that can execute CRUD operations for {@link ISubscriptionRepo}'s
 *
 * @remarks - This is designed to be database agnostic, meaning it can be implemented by most types of databases.
 */
export interface ISubscriptionRepo {
  /**
   * Saves a subscription to the database
   */
  save(subscription: ISubscription): Promise<IDatabaseResponse<any>>;
  /**
   * Deletes a subscription from the database
   */
  delete(subscription: ISubscription): Promise<IDatabaseResponse<any>>;
  /**
   * Gets subscription by id
   */
  getById(id: string): Promise<IDatabaseResponse<ISubscription | null>>;
  /**
   * Gets subscriptions by user id and optionally status from the database
   */
  listByUserId(
    userId: string,
    status?: SubscriptionStatus
  ): Promise<IPaginatedDatabaseResponse<ISubscription[]>>;
  /**
   * Update a subscription within the database
   */
  update(
    id: string,
    params: {
      status?: SubscriptionStatus;
    } & { [key: string]: any }
  ): Promise<any>;
}
