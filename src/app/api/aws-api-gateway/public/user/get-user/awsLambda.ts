import { PublicApiGatewayProxyRequestHandler } from "../../PublicApiGatewayProxyRequestHandler";
import { UserResourceFactory } from "../../../../../user/UserResourceFactory";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AWS_INFRA_CONFIG } from "../../../../../infrastructure/aws/cdk/config";
import { GetUserApi } from "./GetUserApi";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  Handler,
} from "aws-lambda";

/**
 * The api processor, the actual worker that will process the api request.
 * This will be instantianed with this AWS lambda is invoked
 */
const apiProcessor = new GetUserApi(
  new UserResourceFactory(
    new DynamoDBClient(AWS_INFRA_CONFIG.deploymentRegion)
  ).getUserRepo()
);

/**
 * The manager for the raw incoming AWS API Gateway event that will handle basic API security
 * and passing the data to our api processor's methods in order.
 * This will be instantianed with this AWS lambda is invoked.
 */
const getUserApiLambda = new PublicApiGatewayProxyRequestHandler(apiProcessor);

/**
 * The actual lambda function that will be referenced in our infrastructure deployment.
 * The special syntax here is necessary because we're using a method within a class as the lambda function.
 */
export const awsLambda: Handler<APIGatewayProxyEvent, APIGatewayProxyResultV2> =
  getUserApiLambda.handleRequest.bind(getUserApiLambda);
