// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as Cdklambda from '../lib/cdklambda-stack';

// example test. To run these tests, uncomment this file
test("Sample CDK Test", () => {
  class Woop {
    public ppDog: Set<any>;
    public ddDog: any;
    public currDate: Date;
    public child?: Woop;

    constructor(child?: Woop) {
      this.ppDog = new Set();
      this.ppDog.add("1");
      this.ddDog = {};
      this.ddDog["hi"] = new Date();
      this.currDate = new Date();
      this.child = child;
    }
  }

  const cc = new Woop(new Woop());
  console.log(JSON.stringify(cc));

  return;

  //   const app = new cdk.App();
  //     // WHEN
  //   const stack = new Cdklambda.CdklambdaStack(app, 'MyTestStack');
  //     // THEN
  //   const template = Template.fromStack(stack);

  //   template.hasResourceProperties('AWS::SQS::Queue', {
  //     VisibilityTimeout: 300
  //   });
});
