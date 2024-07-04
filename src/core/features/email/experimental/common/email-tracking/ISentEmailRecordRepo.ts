import {
  IPagatinatedDatabaseParams,
  IPaginatedDatabaseResponse,
} from "@/core/database";
import { IDatabaseResponse } from "@/core/database";
import { ISentEmailRecord } from "./ISentEmailRecord";

/**
 * Core interface for CRUD operations with {@link ISentEmailRecord} objects and a database.
 */
export interface ISentEmailRecordRepo {
  /**
   * Saves an {@link ISentEmailRecord} to the database
   */
  save(registration: ISentEmailRecord): Promise<IDatabaseResponse<any>>;

  /**
   * Deletes an {@link ISentEmailRecord} by its id
   */
  delete(id: string): Promise<IDatabaseResponse<any>>;

  /**
   * Gets an {@link ISentEmailRecord} by id
   */
  listByEmail(params: {
    email: string;
    pagination?: IPagatinatedDatabaseParams;
  }): Promise<IPaginatedDatabaseResponse<ISentEmailRecord[]>>;

  listAll(params: {
    pagination?: IPagatinatedDatabaseParams;
  }): Promise<IPaginatedDatabaseResponse<ISentEmailRecord[]>>;
}
