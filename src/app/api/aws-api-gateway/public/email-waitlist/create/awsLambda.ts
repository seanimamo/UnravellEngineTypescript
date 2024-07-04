import { NaiveJsonSerializer } from "@/core/database/serialization";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PublicApiGatewayProxyRequestHandler } from "../../PublicApiGatewayProxyRequestHandler";
import { CreateEmailWaitlistRegistrationApi } from "./CreateEmailWaitlistRegistrationApi";
import { AWS_INFRA_CONFIG } from "../../../../../infrastructure/aws/cdk/config";
import { EmailWaitlistRegistrationRepo } from "../../../../../features/email/email-waitlist/EmailWaitlistRegistrationRepo";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  Handler,
} from "aws-lambda";

/**
 * The api processor, the actual worker that will process the api request.
 * This will be instantianed with this AWS lambda is invoked
 */
const apiProcessor = new CreateEmailWaitlistRegistrationApi(
  new EmailWaitlistRegistrationRepo(
    new DynamoDBClient(AWS_INFRA_CONFIG.deploymentRegion),
    new NaiveJsonSerializer(),
    process.env.EMAIL_WAITLIST_REGISTRATION_TABLE_NAME!
  )
);

/**
 * The manager for the raw incoming AWS API Gateway event that will handle basic API security
 * and passing the data to our api processor's methods in order.
 * This will be instantianed with this AWS lambda is invoked.
 */
const apiProxyLambda = new PublicApiGatewayProxyRequestHandler(apiProcessor);

/**
 * The actual lambda function that will be referenced in our infrastructure deployment.
 * The special syntax here is necessary because we're using a method within a class as the lambda function.
 */
export const awsLambda: Handler<APIGatewayProxyEvent, APIGatewayProxyResultV2> =
  apiProxyLambda.handleRequest.bind(apiProxyLambda);
