# This folder contains tools used to help use this code base such as credential/secrets management

# [secrets-download-script](./secrets-download-script.ts)

-   Many classes rely on configurations within a .env file located at the root of this project, including deployments with aws cdk, integration and even unit tests. After setting up your aws credentials locally with sufficient permissions, you can download this env file using the [secrets-download-script](./src/tools/secrets-download-script.ts). Typically setting up your permissions will involve setting aws credentials under a profile name within a file located at `~/.aws/credentials`

-   To execute [secrets-download-script](./secrets-download-script.ts) install ts-node globally using `npm install -g ts-node` and then run the command `ts-node secrets-download-script.ts`. Make sure you set the `AWS_CREDENTIALS_PROFILE_NAME` variable to the correct profile name for you and the `BUCKET_NAME` variable to the correct name based on what stage of variables you want.

<br>

# [secrets-update-script](./secrets-download-script.ts)

-   This script is to update the .env file saved in aws s3. This should be used whenever you need to update keys/secrets within the .env file.
