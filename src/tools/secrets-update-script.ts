/**
 * This script updates secrets from amazon S3 as a file named .env
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import * as fs from 'fs';
import * as path from 'path';

const AWS_CREDENTIALS_PROFILE_NAME = 'unravellEmailMaster' //  the name of the profile with aws credentials that is saved locally on your machine using the aws cli with `aws configure` command
const S3_REGION = "us-east-1"; // Region that the bucket storing the secrets is
const BUCKET_NAME = "beta-unravell-email-secrets"; // beta-unravell-email-secrets for beta, prod-unravell-email-secrets for prod
const FILE_KEY = ".env"; // key/name of the file in s3. Should be .env


async function uploadFile(filePath: string) {
    const s3Client = new S3Client({
        region: S3_REGION,
        credentials: fromIni({ profile: AWS_CREDENTIALS_PROFILE_NAME }) // provide the name of the profile saved locally on your machine using the aws cli if not using the default e.g. fromIni({profile: 's3SecretsDownloader'})
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => console.log('File Error', err));

    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: FILE_KEY,
        Body: fileStream
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log('Secrets file updated successfully');
    } catch (error) {
        console.error(error);
    }
}

// Relative path to the local .env file
const localFilePath = path.resolve(__dirname, '../../.env');
uploadFile(localFilePath);