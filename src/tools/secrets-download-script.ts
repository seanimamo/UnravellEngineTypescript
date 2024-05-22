/**
 * This script downloads secrets from amazon S3 and saves them to a local file named .env
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import * as fs from 'fs';
import { Readable } from "stream";

const AWS_CREDENTIALS_PROFILE_NAME = 'unravellEmailMaster' //  the name of the profile with aws credentials that is saved locally on your machine using the aws cli with `aws configure` command
const S3_REGION = "us-east-1"; // Region that the bucket storing the secrets is
const BUCKET_NAME = "beta-unravell-email-secrets"; // beta-unravell-email-secrets for beta, prod-unravell-email-secrets for prod
const FILE_KEY = ".env"; // key/name of the file in s3. Should be .env

const downloadSecretsFromS3 = async () => {
    const s3Client = new S3Client({
        region: S3_REGION,
        credentials: fromIni({ profile: AWS_CREDENTIALS_PROFILE_NAME }) // provide the name of the profile saved locally on your machine using the aws cli if not using the default e.g. fromIni({profile: 's3SecretsDownloader'})
    });

    // Get the object from S3 and write it to a local file
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: FILE_KEY });

    try {
        const data = await s3Client.send(command);
        const body = data.Body as Readable;

        return new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream('../../.env');

            body.pipe(writeStream)
                .on('error', reject)
                .on('close', resolve);
        });
    } catch (error) {
        console.error(error);
    }
}

downloadSecretsFromS3().then(() => console.log('File downloaded successfully'));
