import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UserResourceFactory } from "../UserResourceFactory";
import { CognitoPostConfirmationTriggerLambda } from "../../../core/user/aws-cognito/webhooks/post-confirmation";
import { BasicCognitoPostConfirmationWebhook } from "../../../core/user/aws-cognito/webhooks/post-confirmation";
import { AWS_INFRA_CONFIG } from "../../infrastructure/aws/cdk/config";
// import { createLambdaHandlerFromClassMethod } from "../../core/infrastructure/aws/lambda";

/**
 * This is a concrete implementation of the {@link CognitoPreSignUpTriggerLambda}
 */
const postConfirmationLambdaTrigger = new CognitoPostConfirmationTriggerLambda(
    new BasicCognitoPostConfirmationWebhook(
        new UserResourceFactory(
            new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
        )
    )
);

/**
 * This function is necessary for us to point AWS CDK to as our Lambda function
 * because we are using a method within a class instead of just a function.
 *
 * If you call an instance method inside a handler you’re likely to get an error.
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
