import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventBase,
  APIGatewayProxyResultV2,
  Context,
  Handler,
} from "aws-lambda";
import { ApiError, UnauthorizedApiError } from "../../ApiError";
import { IApiRequestProcessor } from "../IApiRequestProcessor";
import { IApiRequest } from "../IApiRequest";
import { IApiResponse } from "../IApiResponse";
import { Stage } from "../../../infrastructure";

export interface IApiGatewayProxyRequestProcessor<TApiGatewayAuthorizerContext>
  extends IApiRequestProcessor<
    APIGatewayProxyEventBase<TApiGatewayAuthorizerContext>,
    TApiGatewayAuthorizerContext,
    IApiRequest,
    IApiResponse
  > {}

/**
 * This class intended to be used as a reusable AWS Lambda {@link BaseLambdaApiGatewayProxy.handleRequest | function handler}
 * for an AWS API Gateway Lambda Proxy. It contains all the common HTTP API related logic and by supplying different
 * {@link IApiRequestProcessor | API processors} you can reuse this class to handle all of your different API endpoints.
 */
export abstract class BaseApiGatewayProxyRequestHandler<
  TApiGatewayAuthorizerContext
> {
  constructor(
    /**
     * The class that will be handling the logic for processing the api request
     */
    private readonly apiRequestProcessor: IApiGatewayProxyRequestProcessor<TApiGatewayAuthorizerContext>,
    /**
     * Gets the set of domains that are allowed to make requests to this API.
     * @remarks Add to the set to "*" to allow any domain.
     */
    private readonly originAllowList: Set<string>
  ) {}

  verifyHttpEvent(
    event: APIGatewayProxyEventBase<TApiGatewayAuthorizerContext>
  ) {
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

  handleRequest: Handler<
    APIGatewayProxyEventBase<TApiGatewayAuthorizerContext>,
    APIGatewayProxyResultV2
  > = async (
    event: APIGatewayProxyEventBase<TApiGatewayAuthorizerContext>,
    context: Context
  ) => {
    console.info("Recieved APIGatewayProxyEvent:", event);
    console.info(
      "Lambda Authorizor:",
      JSON.stringify(event.requestContext.authorizer)
    );
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
        this.apiRequestProcessor.authorizeRequest(
          event.requestContext.authorizer,
          request
        );
      }

      // const request = this.apiRequestProcessor.extractRequest(event);
      // console.info("Successfully extracted api request: ", request);
      // this.apiRequestProcessor.validateRequestData(request);
      // console.info("Validated api request.");
      // this.apiRequestProcessor.authorizeRequest(
      //     request,
      //     event.requestContext.authorizer
      // );
      // console.info("Authorized request.");
      const response = await this.apiRequestProcessor.processRequest(request);
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
          statusCode: error.httpCode,
          body: JSON.stringify({
            error: {
              code: error.code,
              message: error.message,
            },
          }),
          headers: this.createResponseHeaders(),
        };
      }
      console.error("Unexpected error occured while processing request", error);
      throw error;
    }
  };
}
