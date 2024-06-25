import { CustomEmailSenderTriggerEvent } from "aws-lambda";
import { ICognitoCustomEmailSenderEventHandler } from ".";
import {
  CommitmentPolicy,
  KmsKeyringNode,
  buildClient,
} from "@aws-crypto/client-node";
import { toByteArray } from "base64-js";
import { AWS_INFRA_CONFIG } from "../../../../../../app/infrastructure/aws/cdk/config";

/**
 * TODO: INCOMPLETE IMPLEMENTATION - NOT READY FOR USE!!!
 *
 * Basic implementation of {@link ICognitoCustomMessageEventHandler} that allows you to take complete control over sending emails via cognito.
 * Cognito will send the events to this lambda and you handle sending the emails yourself with whatever you want.
 *
 * @remarks not to be confused with the Custom Message Sender Lambda, where you just customize the email body & subject and
 * cognito still handles actually sending the email for your via SES
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html
 *
 */
export class BasicCognitoCustomEmailSenderEventHandler
  implements ICognitoCustomEmailSenderEventHandler
{
  async handleEvent(
    event: CustomEmailSenderTriggerEvent
  ): Promise<CustomEmailSenderTriggerEvent> {
    console.log("recieved CustomEmailSenderTriggerEvent: ", event);
    console.log("event.request: ", event.request);
    console.log("user attributes: ", event.request.userAttributes);

    if (
      event.triggerSource === "CustomEmailSender_SignUp" ||
      event.triggerSource === "CustomEmailSender_ResendCode"
    ) {
      console.log("mock handling verify event....");

      if (event.request.code) {
        console.log("event has code!");
        // https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/js-examples.html#javascript-example-decrypt
        const { decrypt } = buildClient(
          CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT
        );

        // This gets set in our core cognito stack, take at the cognito stack within core/infrastructure.
        const keyIds = [process.env.KMS_KEY_ARN!];
        const keyring = new KmsKeyringNode({ keyIds });
        const { plaintext, messageHeader } = await decrypt(
          keyring,
          toByteArray(event.request.code)
        );

        console.log("plaintext", plaintext.toString("utf8"));
        console.log("messageHeader", messageHeader);

        const headerColor = "#191F28";

        const emailTemplate = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome Email</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    background: white;
                    margin: 20px auto;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #0073e6;
                    color: white;
                    padding: 10px 20px;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                    line-height: 1.6;
                }
                .footer {
                    background-color: #f8f8f8;
                    color: #666;
                    text-align: center;
                    padding: 10px 20px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    Welcome to ${AWS_INFRA_CONFIG.appName}!
                </div>
                <div class="content">
                    <h2>Hi ${event.request.userAttributes.given_name},</h2>
                    <p>We're excited to have you onboard. Thank you for joining us! We are dedicated to ensuring you get the most out of our services. Here are some resources to get you started:</p>
                    <ul>
                        <li><a href="#">Getting Started Guide</a></li>
                        <li><a href="#">Your Account</a></li>
                        <li><a href="#">Support Center</a></li>
                    </ul>
                    <p>If you have any questions, feel free to reach out to our support team at any time. We're here to help!</p>
                    <p>Welcome aboard,</p>
                    <p><strong>${AWS_INFRA_CONFIG.appName} Team</strong></p>
                </div>
                <div class="footer">
                    © 2024 ${AWS_INFRA_CONFIG.appName}. All rights reserved.
                </div>
            </div>
        </body>
        </html>`;

        // TODO: Send email with custom email service.
      }
    }

    return event;
  }
}
