import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";

export { CoreAwsInfraBuilder } from "./CoreAwsInfraBuilder";

export interface CustomNodeJsLambdaConfig extends NodejsFunctionProps {
  /**
   * The path to the file containing the lambda function
   */
  entry: string;
  /**
   * The name of the function within the provided file used as the lambda function
   */
  handler: string;
}
