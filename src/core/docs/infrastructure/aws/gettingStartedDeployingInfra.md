# Getting Started - Setting up AWS CDK

The following documentation covers how to get started with AWS CDK so you can deploy your first application to the AWS.

For a nice video walkthrough, watch the [following video instead](https://www.youtube.com/watch?v=Fa3PfnaK5dc&ab_channel=FarukAda)

## Step 1: Create an AWS Account

Go to https://console.aws.amazon.com/ and create a new AWS account.

## Step 2: Setup AWS CDK

AWS CDK (Cloud Developer Kit) enables us to write our infrastructure as code and easily deploy it.

- ## 2a. Install the AWS CLI

  [Follow the instructions here to install the AWS CLI on your operating system](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

  Once you've install the AWS CLI, if you run the command `aws help` from your terminal you should see some ouput about how to use the CLI.

- ## 2b. Configure Programmatic Access to your AWS account

  We'll need to store credentials to our AWS account locally on our machine using the AWS CLI so we can deploy our infrastructure.
  In order to do this properly, we will create new user with credentials to deploy CDK apps. We'll create the user using AWS IAM (Identity Access Management) attach the proper credentials and finally create an access key and secret key pair that we can store on our local machine.

  What you'll need to do is the following:

  1. Login to your aws account console https://console.aws.amazon.com/
  2. Navigate to the IAM service page
  3. Click "Users" on the lefthand navbar
  4. Click the button to Create a new user
  5. Name the user "cdk-user" this doesn't matter, we just need to a nice descriptive name.
  6. Click "Attach policies directly" and add the `AdministratorAccess` policy.
  7. Continue with the user and complete its creation
  8. Go back and click on your newly created user, and select the "Security Credentials" tab
  9. Click "Create access key", then select `Command line interface` as the use case and press next
  10. Add a nice description for what this key is being used for, e.g. 'programmatic access to deploy cdk apps on seans macbook pro" and complete the key creation
  11. Save the access key and secret access key to a text file
  12. Store our cdk-user account credentials locally using the aws cli. Run the command `aws configure --profile <your_App_name>-cdk-user` replacing `<your_App_name>` with the name of your app. You will prompted to provide your access key and secret access key. You can just hit enter for the rest of the questions such as default region and so on.

- ## 2c. Install the AWS CDK CLI

  Run `npm install -g aws-cdk`
  Once you've install the AWS CDK CLI, you should be able to run the command `cdk --version` and see some ouput without errors.

- ## 2d. Bootstrap CDK in your AWS account

  AWS CDK needs to have some permissions bootstrapped in order to function. Run the command `cdk bootstrap --profile <your_profile_name> <your_aws_accountId>/<region>` replacing `<your_profile_name>` with the name of the profile you made in step 2b as well as putting in your AWS account id and the region to bootstrap in.

  - I recommend boostrapping in us-east-1. This region typically has the latest and greatest features.
  - Example complete command `cdk boostrap --profile myapp-cdk-user 12345678/us-east-1`
  - [More info on the CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-bootstrap)

Done! You've completed the necessary setup for AWS CDK and are ready to begin configuring your app for deployment.

[Read more with aws official documentation](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

## Step 3: Get a domain name for your application

See the docs in setting up your domain in AWS [here](./domains.md)

## Step 4: Build your infrastructure templates and deploy them
