# UnravellEmailBackend Typescript Package

This package contains both aws cdk infrastructure AND typescript backend logic for Convo.
Running `cdk synth` will compile the backend typescript components and package them for deployment

## Packages
* api
* aws-cdk - infrastructure for convo
* common - common objects and methods for unravell

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`      deploy this stack to your default AWS account/region
* `npx cdk diff`        compare deployed stack with current state
* `npx cdk synth`       emits the synthesized CloudFormation template


<br>

# **Setting Up AWS Credentials**


Use the AWS CLI to configure your access key id and secret under a profile named `unravellEmailMaster` and have it saved to a local file using the command `aws configure --profile unravellEmailMaster`.

 Now tests that create an aws client using the `credentials: fromIni({profile: 'unravellEmailMaster'})` constructor option will read creds from your local file and profile named `unravellEmailMaster`.

<br>


<br>

# **Setting up your .env file containing repository secrets**

Many classes rely on configurations within a .env file within the root of this project, including deployments with aws cdk, integration and even unit tests. After setting up your aws credentials locally with sufficient permissions, you can download this env file using the [secrets-download-script](./src/tools/secrets-download-script.ts). See the README there for more info but you should be able to just execute the script with ts-node

<br>


<br>

# **Testing** 
## **Running unit tests**
 - Run the command `npm run test` which will run an npm script that will execute tests whose file names end in `.test.ts` using the jest [jest.config.js](./jest.config.js) file 

## **Running integration tests** 
Integration test file names end in `.integ.ts`. Before you can run them you'll have to complete some steps to get proper credentials and secrets setup.

 - ### **Required Setup before running integration tests:**
   1. Read and complete the  **Setting Up AWS Credentials for testing** section of this readme so you'll have access to aws resources.

 - ### **To run ALL integration tests:**
   - Run the command `npm run integration-test` which will run an npm script that will execute tests whose file names end in `.test.ts` using the jest [jest.config.integration.js](./jest.integration.js) file