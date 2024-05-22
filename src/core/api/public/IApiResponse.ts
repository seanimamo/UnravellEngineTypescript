/**
 * The base interface for an API Response.
 */
export interface IApiResponse {
    statusCode: number;
    body: {
        data: Record<string, unknown> | null;
    };
}

/**
 * An extended interface from {@link IApiResponse} that includes pagination
 * data.
 */
export interface IPaginatedApiResponse extends IApiResponse {
    body: {
        data: Record<string, unknown> | null;
        paginationToken: unknown;
    };
}
