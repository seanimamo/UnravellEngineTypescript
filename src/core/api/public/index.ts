export interface IApiRequest {}

export type IApiResponseData = {} | null;

/**
 * The base interface for an HTTP API Response.
 */
export interface IHttpApiResponse<TResponseData extends IApiResponseData> {
  /**
   * The HTTP status code
   */
  statusCode: number;
  body: {
    data: TResponseData;
  };
}

/**
 * An extended interface from {@link IApiResponse} that includes pagination
 * data.
 */
export interface IPaginatedApiResponse<TResponseData extends IApiResponseData>
  extends IHttpApiResponse<TResponseData> {
  body: {
    data: TResponseData;
    paginationToken: unknown;
  };
}

/**
 * The core interface for An Api Request Processor. This is the
 * core brains of any api endpoint.
 * It is designed to be usable with any actual api infrastructure.
 */
export interface IApiRequestProcessor<
  TSourceHttpEvent,
  TApiRequest extends IApiRequest,
  TApiResponseData extends IApiResponseData
> {
  extractRequest?(sourceEvent: TSourceHttpEvent): TApiRequest;

  validateRequestData?(request: TApiRequest): Promise<void>;

  authorizeRequest?(
    authData: TSourceHttpEvent,
    request?: TApiRequest
  ): Promise<void>;

  processRequest(
    request?: TApiRequest
  ): Promise<IHttpApiResponse<TApiResponseData>>;
}
