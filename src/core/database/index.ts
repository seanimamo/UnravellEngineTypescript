export { type ISerializer } from "./serialization";
export { NaiveJsonSerializer } from "./serialization/NaiveJsonSerializer";
export * from "./DatabaseError";
/**
 * Core interface for database responses.
 *
 * @remarks instead of having responses directly just be the request object "T",
 * this object design allow extendability with additional attributes as needed.
 */
export interface IDatabaseResponse<T> {
  data: T;
}

export interface IPaginatedDatabaseResponse<T> extends IDatabaseResponse<T> {
  data: T;
  paginationToken?: unknown;
}

export interface IPagatinatedDatabaseParams {
  /**
   * The number of results to return
   */
  maxResults?: number;
  paginationToken?: unknown;
}
