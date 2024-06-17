import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UserResourceFactory } from "../../../UserResourceFactory";
import { CognitoPostConfirmationTriggerLambda } from "../../../../../core/user/authentication/aws-cognito/webhooks/post-confirmation";
import { BasicCognitoPostConfirmationWebhook } from "../../../../../core/user/authentication/aws-cognito/webhooks/post-confirmation";
import { AWS_INFRA_CONFIG } from "../../../../infrastructure/aws/cdk/config";
// import { createLambdaHandlerFromClassMethod } from "../../core/infrastructure/aws/lambda";

/**
 * This is the core logic of handling the cognito post account confirmation webhook event.
 * @remarks You can add customer logic here by using your own class that either extends {@link BasicCognitoPostConfirmationWebhook}
 * implements the ICognitoPostConfirmationUpWebhook interface.
 */
const cognitoPostConfirmatioWebhook = new BasicCognitoPostConfirmationWebhook(
  new UserResourceFactory(
    new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
  )
);

/**
 * This is actual AWS lambda function handler implementation that will be deployed. it will utislize the
 */
const postConfirmationLambdaTrigger = new CognitoPostConfirmationTriggerLambda(
  cognitoPostConfirmatioWebhook
);

/**
 * This function is necessary for us because we're using method within a class
 * rather than just a function in order to be properly bundled as an AWS lambda function.
 *
 * @remarks the reason you need this is  because If you call an instance method inside a handler you get an error.
 * It is a well known side effect of passing functions as value.
 * Because they are being used in isolation through dynamic binding, they lose the calling context.
 * Luckily, this can be easily solved with context binding:
 */
export const postConfirmationLambdaTrigger_handleRequest =
  postConfirmationLambdaTrigger.handleRequest.bind(
    postConfirmationLambdaTrigger
  );

// TODO: Try this instead of manually creating them.
// export const awsLambdaHandler = createLambdaHandlerFromClassMethod(
//     postConfirmationLambdaTrigger,
//     "handleRequest"
// );
