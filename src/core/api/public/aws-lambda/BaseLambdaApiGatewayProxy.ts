import {
  APIGatewayProxyEventBase,
  APIGatewayProxyResultV2,
  Context,
  Handler,
} from "aws-lambda";
import { ApiError } from "../../ApiError";
import { IApiResponse } from "../IApiResponse";
import { IApiRequestProcessor } from "../IApiRequestProcessor";
import { IApiRequest } from "../IApiRequest";
import { Stage } from "../../../infrastructure";

/**
 * This class intended to be used as a reusable AWS Lambda {@link BaseLambdaApiGatewayProxy.handleRequest | function handler}
 * for an AWS API Gateway Lambda Proxy. It contains all the common HTTP API related logic and by supplying different
 * {@link IApiRequestProcessor | API processors} you can reuse this class to handle all of your different API endpoints.
 */
export abstract class BaseLambdaApiGatewayProxy<TLambdaAuthorizer> {
  /**
   * The infrastructure stage this AWS Lambda will be running in. e.g. Beta for testing versus Prod for customer use.
   */
  private readonly stage: Stage;
  /**
   * the set of domains that are allowed to make requests to this API.
   */
  private readonly originAllowList: Set<string>;
  constructor(
    private readonly apiRequestProcessor: IApiRequestProcessor<
      APIGatewayProxyEventBase<TLambdaAuthorizer>,
      TLambdaAuthorizer,
      IApiRequest,
      IApiResponse
    >
  ) {
    this.stage =
      process.env.STAGE !== undefined
        ? Stage[process.env.STAGE.toUpperCase() as keyof typeof Stage]
        : Stage.BETA;

    this.originAllowList = this.initializeOriginAllowList(this.stage);
  }

  abstract verifyEventOrigin(
    event: APIGatewayProxyEventBase<TLambdaAuthorizer>
  ): void;

  /**
   * Gets the set of domains that are allowed to make requests to this API.
   * @remarks Add to the set to "*" to allow any domain.
   */
  abstract initializeOriginAllowList(stage: Stage): Set<string>;

  /**
   * Gets the HTTP headers to be included on the API response.
   * @remarks Update this to specify more specifc allowed origins such as your frontend domain if needed
   */
  abstract getResponseHeaders(): Record<string, string>;

  handleRequest: Handler<
    APIGatewayProxyEventBase<TLambdaAuthorizer>,
    APIGatewayProxyResultV2
  > = async (
    event: APIGatewayProxyEventBase<TLambdaAuthorizer>,
    context: Context
  ) => {
    console.info("Recieved APIGatewayProxyEvent:", event);
    console.info(
      "Cognito authorizor:",
      JSON.stringify(event.requestContext.authorizer)
    );
    try {
      this.verifyEventOrigin(event);
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
        headers: this.getResponseHeaders(),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        console.info("ApiError occured while processing request", error);
        return {
          statusCode: error.statusCode,
          body: JSON.stringify({
            error: {
              type: error.errorType,
              message: error.message,
            },
          }),
          headers: this.getResponseHeaders(),
        };
      }
      console.error("Unexpected error occured while processing request", error);
      throw error;
    }
  };
}
