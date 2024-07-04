import {
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  Context,
  Handler,
} from "aws-lambda";
import {
  IApiRequestProcessor,
  IApiRequest,
  IApiResponseData,
  IHttpApiResponse,
} from "../";
import { UnauthorizedApiError } from "../error/CommonApiErrors";
import { ApiError } from "../error/ApiError";

export interface IApiGatewayProxyRequestProcessor
  extends IApiRequestProcessor<
    APIGatewayProxyEvent,
    IApiRequest,
    IApiResponseData
  > {}

/**
 * The manager for handling the raw incoming AWS API Gateway Proxy events that will handle basic HTTP API security
 * and passing the data to an {@link IApiRequestProcessor}'s that will handle actually processing the request.
 */
export abstract class BaseApiGatewayProxyRequestHandler {
  constructor(
    /**
     * The class that will be handling the logic for processing the api request
     */
    private readonly apiRequestProcessor: IApiGatewayProxyRequestProcessor,
    /**
     * Gets the set of domains that are allowed to make requests to this API.
     * @remarks Add to the set to "*" to allow any domain.
     */
    private readonly originAllowList: Set<string>
  ) {}

  verifyHttpEvent(event: APIGatewayProxyEvent) {
    const requestOrigin = event.headers["origin"];
    if (!requestOrigin) {
      throw new UnauthorizedApiError(
        `Request origin is not allow listed: ${requestOrigin}`
      );
    }
    if (requestOrigin && !this.originAllowList.has(requestOrigin)) {
      throw new UnauthorizedApiError(
        `Request origin is not allow listed: ${requestOrigin}`
      );
    }
  }

  /**
   * Creates the HTTP headers to be included on the API response.
   * @remarks Update this to specify more specifc allowed origins such as your frontend domain if needed
   */
  abstract createResponseHeaders(): Record<string, string>;

  handleRequest: Handler<APIGatewayProxyEvent, APIGatewayProxyResultV2> =
    async (event: APIGatewayProxyEvent, context: Context) => {
      console.info("Recieved APIGatewayProxyEvent:", event);
      try {
        this.verifyHttpEvent(event);
        let request: IApiRequest | undefined = undefined;

        // ApiRequestProcessors don't always have any actual request data necessary to process.
        if (this.apiRequestProcessor.extractRequest) {
          request = this.apiRequestProcessor.extractRequest(event);
          console.info("Successfully extracted api request: ", request);
        }

        if (
          this.apiRequestProcessor.validateRequestData &&
          request !== undefined
        ) {
          this.apiRequestProcessor.validateRequestData(request);
          console.info("Validated api request.");
        }

        if (this.apiRequestProcessor.authorizeRequest) {
          this.apiRequestProcessor.authorizeRequest(event, request);
        }

        const response: IHttpApiResponse<IApiResponseData> =
          await this.apiRequestProcessor.processRequest(request);
        return {
          statusCode: response.statusCode,
          body:
            response.body === null ? undefined : JSON.stringify(response.body!),
          headers: this.createResponseHeaders(),
        };
      } catch (error) {
        if (error instanceof ApiError) {
          console.info("ApiError occured while processing request", error);
          return {
            statusCode: error.httpStatusCode,
            body: JSON.stringify({
              error: {
                code: error.code,
                message: error.message,
              },
            }),
            headers: this.createResponseHeaders(),
          };
        }
        console.error(
          "Unexpected error occured while processing request",
          error
        );
        throw error;
      }
    };
}
