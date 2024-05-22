import { IDatabaseResponse } from "./IDatabaseResponse";

export interface IPaginatedDatabaseResponse<T> extends IDatabaseResponse<T> {
    data: T;
    paginationToken?: unknown;
}
