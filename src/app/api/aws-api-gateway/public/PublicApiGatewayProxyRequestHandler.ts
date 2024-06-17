import { APIGatewayProxyCognitoAuthorizer } from "aws-lambda";
import { BaseApiGatewayProxyRequestHandler } from "../../../../core/api/public/aws-lambda";
import { IApiGatewayProxyRequestProcessor } from "../../../../core/api/public/aws-lambda/BaseApiGatewayProxyRequestHandler";

/**
 * The primary class intended to be used to as a Lambda Proxy API Endpoint with AWS Api Gateway.
 * The provided {@link IApiRequestProcessor} to the constructor of this class will control the actual
 * logic for the API as well as the expect request object and response.
 *
 * @see {@link BasicLambdaApiRequestHanderWithCognitoAuthorizer}
 */
export class PublicApiGatewayProxyRequestHandler extends BaseApiGatewayProxyRequestHandler<APIGatewayProxyCognitoAuthorizer> {
  constructor(
    apiRequestProcessor: IApiGatewayProxyRequestProcessor<APIGatewayProxyCognitoAuthorizer>
  ) {
    super(apiRequestProcessor, new Set());
  }

  // TODO: UNCOMMENT THIS AFTER VERIFYING WHAT CHROME EXTENSION ORIGIN LOOKS LIKE
  //   verifyHttpEvent(event: APIGatewayProxyWithCognitoAuthorizerEvent): void {
  // const requestOrigin = event.headers["origin"];
  // if (!requestOrigin) {
  //     if (this.stage === Stage.PROD) {
  //         throw new UnauthorizedApiError("Request origin is missing but required in production environment");
  //     }
  //     if (!event.headers['User-Agent']?.includes("PostmanRuntime")) {
  //         throw new UnauthorizedApiError(`Unauthorized user agent: ${event.headers['User-Agent']}`);
  //     }
  // }
  // if (requestOrigin && !this.originAllowList.has(requestOrigin)) {
  //     throw new UnauthorizedApiError(`Request origin is not allow listed: ${requestOrigin}`);
  // }
  //   }

  createResponseHeaders(): Record<string, string> {
    return {
      // TODO: Update this to specify the allowed origins if it makes sense
      "Access-Control-Allow-Origin": "*",
    };
  }
}
