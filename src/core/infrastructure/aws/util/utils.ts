import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export function createDynamoAllowPolicyForAllIndexes(actions: string[], props: {
  mainTableName: string,
  mainTableArn: string;
  mainTableArnGsi1Arn: string;
  mainTableArnGsi2Arn: string;
  mainTableArnGsi3Arn: string;
  mainTableArnGsi4Arn: string;
  mainTableArnGsi5Arn: string;
  mainTableArnGsi6Arn: string;
  mainTableArnGsi7Arn: string;
  mainTableArnGsi8Arn: string;
  mainTableArnGsi9Arn: string;
  mainTableArnGsi10Arn: string;
  mainTableArnGsi11Arn: string;
  mainTableArnGsi12Arn: string;
  mainTableArnGsi13Arn: string;
  mainTableArnGsi14Arn: string;
  mainTableArnGsi15Arn: string;
  mainTableArnGsi16Arn: string;
  mainTableArnGsi17Arn: string;
  mainTableArnGsi18Arn: string;
  mainTableArnGsi19Arn: string;
  mainTableArnGsi20Arn: string;
}) {
  return new PolicyStatement({
    actions,
    effect: Effect.ALLOW,
    resources: [
      props.mainTableArn, props.mainTableArnGsi1Arn, props.mainTableArnGsi2Arn, props.mainTableArnGsi3Arn, props.mainTableArnGsi4Arn,
      props.mainTableArnGsi5Arn, props.mainTableArnGsi6Arn, props.mainTableArnGsi7Arn, props.mainTableArnGsi8Arn, props.mainTableArnGsi9Arn,
      props.mainTableArnGsi10Arn, props.mainTableArnGsi11Arn, props.mainTableArnGsi12Arn, props.mainTableArnGsi13Arn, props.mainTableArnGsi14Arn,
      props.mainTableArnGsi15Arn, props.mainTableArnGsi16Arn, props.mainTableArnGsi17Arn, props.mainTableArnGsi18Arn, props.mainTableArnGsi19Arn, props.mainTableArnGsi20Arn
    ]
  })
}