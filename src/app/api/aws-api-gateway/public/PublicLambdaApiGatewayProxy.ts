import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyWithCognitoAuthorizerEvent,
} from "aws-lambda";
import { BaseLambdaApiGatewayProxy } from "../../../../core/api/public/aws-lambda";
import { Stage } from "../../../../core/infrastructure";

/**
 * The primary class intended to be used to as a Lambda Proxy API Endpoint with AWS Api Gateway.
 * The provided {@link IApiRequestProcessor} to the constructor of this class will control the actual
 * logic for the API as well as the expect request object and response.
 *
 * @see {@link BasicLambdaApiRequestHanderWithCognitoAuthorizer}
 */
export class PublicLambdaApiGatewayProxy extends BaseLambdaApiGatewayProxy<APIGatewayProxyCognitoAuthorizer> {
  // TODO: UNCOMMENT THIS AFTER VERIFYING WHAT CHROME EXTENSION ORIGIN LOOKS LIKE
  verifyEventOrigin(event: APIGatewayProxyWithCognitoAuthorizerEvent): void {
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
  }

  initializeOriginAllowList(stage: Stage): Set<string> {
    if (stage === Stage.PROD) {
      scrollTo;
      return new Set(["https://www.convo.video"]);
    } else {
      return new Set([
        "http://localhost:8000",
        "http://localhost:8080",
        "https://www.convo.video",
        "chrome-extension://fhbjgbiflinjbdggehcddcbncdddomop",
      ]);
    }
  }

  getResponseHeaders(): Record<string, string> {
    return {
      // TODO: Update this to specify the allowed origins if it makes sense
      "Access-Control-Allow-Origin": "*",
    };
  }
}
