import {
  Context,
  PreSignUpTriggerEvent,
  PreSignUpTriggerHandler,
} from "aws-lambda";

export { BasicCognitoPreSignUpEventHandler } from "./BasicCognitoPreSignUpEventHandler";

export interface ICognitoPreSignUpEventHandler {
  handleEvent(event: PreSignUpTriggerEvent): Promise<void>;
}

/**
 * Utility class that provides the function expected by AWS Lambda for the
 * AWS Cognito Lambda Pre Sign up trigger Lambda.
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
 *
 * @example
 * ```
 * const preSignUpLambdaTrigger = new CognitoPreSignUpTriggerLambda(
 *  new BasicCognitoPreSignUpWebhook(
 *    new UserResourceFactory(
 *     new DynamoDBClient({ region: AWS_INFRA_CONFIG.deploymentRegion })
 *  ),
 *     new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *       apiVersion: "2022-11-15",
 *     })
 *  )
 * );
 * ```
 */
export class CognitoPreSignUpTriggerLambda {
  constructor(
    private readonly preSignUpEventHandlder: ICognitoPreSignUpEventHandler
  ) {}

  handleRequest: PreSignUpTriggerHandler = async (
    event: PreSignUpTriggerEvent,
    context: Context,
    callback
  ) => {
    await this.preSignUpEventHandlder.handleEvent(event);
    // Returns response to Amazon Cognito
    callback(null, event);
  };
}
