/**
 * Core interface for database responses.
 *
 * @remarks instead of having responses directly just be the request object "T",
 * this object design allow extendability with additional attributes as needed.
 */
export interface IDatabaseResponse<T> {
    data: T;
}
