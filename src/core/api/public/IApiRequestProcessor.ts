import { IApiRequest } from "./IApiRequest";
import { IApiResponse } from "./IApiResponse";

export interface IApiRequestProcessor<
    TSourceEvent,
    TAuthorizationData,
    TApiRequest extends IApiRequest | undefined,
    TApiResponse extends IApiResponse
> {
    extractRequest?(sourceEvent: TSourceEvent): TApiRequest;
    validateRequestData?(request: TApiRequest): Promise<void>;
    authorizeRequest?(
        authData: TAuthorizationData,
        request?: TApiRequest
    ): Promise<void>;
    processRequest(request?: TApiRequest): Promise<TApiResponse>;
}
