import {
  CustomMessageResendCodeTriggerEvent,
  CustomMessageSignUpTriggerEvent,
  CustomMessageTriggerEvent,
} from "aws-lambda";
import { ICognitoCustomMessageEventHandler } from ".";
import { AWS_INFRA_CONFIG } from "../../../../../../app/infrastructure/aws/cdk/config";

/**
 * Basic implementation of {@link ICognitoCustomMessageEventHandler} that handles customizing email message subjects and bodies sent by aws cognito.
 *
 * @remarks not to be confused with the Custom Email Sender Lambda, which is designed for you to entirely intercept
 * and figure out how to send the email by yourself. The Custom Message lambda used here in contrast handles sending the email and we just need to customize the body.
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html
 */
export class BasicCognitoCustomMessageEventHandler
  implements ICognitoCustomMessageEventHandler
{
  async handleEvent(
    event: CustomMessageTriggerEvent
  ): Promise<CustomMessageTriggerEvent> {
    console.log("recieved CustomEmailSenderTriggerEvent: ", event);
    console.log("event.request: ", event.request);
    console.log("user attributes: ", event.request.userAttributes);

    if (event.triggerSource === "CustomMessage_SignUp") {
      await this.handleSignUp(event);
      return event;
    } else if (event.triggerSource === "CustomMessage_ResendCode") {
      await this.handleResendCode(event);
      return event;
    }

    return event;
  }

  /**
   * Handles a incoming new Sign Up event from AWS Cognito, customizing the email subject and body that gets send to the end user
   */
  private async handleSignUp(event: CustomMessageSignUpTriggerEvent) {
    console.log("mock handling sign up event....");

    if (event.request.codeParameter) {
      console.log("event has code!");
      event.response.emailSubject = `Welcome to ${AWS_INFRA_CONFIG.appName}`;
      event.response.emailMessage = this.createWelcomeVerifyCodeEmailTemplate({
        firstName: event.request.userAttributes.given_name,
        verifyCodeLink: `${process.env.FRONT_END_VERIFY_CODE_URL}?code=${event.request.codeParameter}`,
        appName: AWS_INFRA_CONFIG.appName,
        companyName: AWS_INFRA_CONFIG.appName,
      });
    }
  }

  /**
   * Handles a incoming new resend code event from AWS Cognito, customizing the email subject and body that gets send to the end user
   */
  private async handleResendCode(event: CustomMessageResendCodeTriggerEvent) {
    console.log("mock handling resend code event....");

    if (event.request.codeParameter) {
      console.log("event has code!");

      event.response.emailSubject = `Your ${AWS_INFRA_CONFIG.appName} Account Verification Link`;
      event.response.emailMessage = this.createWelcomeVerifyCodeEmailTemplate({
        firstName: event.request.userAttributes.given_name,
        verifyCodeLink: `${process.env.FRONT_END_VERIFY_CODE_URL}?code=${event.request.codeParameter}`,
        appName: AWS_INFRA_CONFIG.appName,
        companyName: AWS_INFRA_CONFIG.appName,
      });
    }
  }

  private createWelcomeVerifyCodeEmailTemplate(params: {
    firstName?: string;
    verifyCodeLink: string;
    appName: string;
    companyName: string;
  }) {
    return `<!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome Email</title>
            <style>
                body, table, td, a {
                    font-family: Arial, sans-serif;
                }
                body {
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                table {
                    border-spacing: 0;
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                }
                .header {
                    background-color: #191F28;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    font-size: 15px;
                }
                .content {
                    padding: 40px;
                    line-height: 1.6;
                    background-color: #232E3A;
                    color: #FFF;
                    font-size: 16px;
                }
                .footer {
                    background-color: #232E3A;
                    color: #fff !important;
                    padding: 25px;
                    padding-left: 40px;
                    padding-right: 40px;
                    font-size: 14px;
                } 
                .verifyButtonContent {
                    padding-left: 40px;
                    padding-right: 40px;
                    line-height: 1.6;
                    background-color: #232E3A;
                    color: #FFF;
                    font-size: 16px;
                }
                .verifyButton {
                    background-color: #7d4987;
                    border-radius: 8px;
                    color: #fff !important;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 20px;
                    padding: 15px 0 15px 0;
                    text-decoration: none;
                    width: 200px;
                }
                .verifyButton:hover {
                    background-color: #7635dc;
                    border-radius: 25px;
                    transition-duration: 250ms;
                }
            </style>
            </head>
            <body>
            <table role="presentation">
                <tr>
                    <td class="header">
                        <h1> Welcome to ${params.appName}!</h1>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <h2>Hi ${params.firstName ?? ""},</h2>
                            <p>We're excited to have you onboard. Thank you for joining us! Please click this link to verify your account. </p>
                    </td>
                </tr>
                <tr>
                    <td class="verifyButtonContent" style="text-align: center;">
                        <a class='verifyButton' href="${
                          params.verifyCodeLink
                        }">Verify your account
                        </a>
                    </td>
                </tr>
                
                <tr>
                    <td class="content">
                        <p>Welcome aboard,</p>
                        <p><strong>The ${params.appName} Team</strong></p>
                    </td>
                </tr>
                <tr>
                    <td class="footer">
                        © 2024 ${params.companyName}. All rights reserved.
                    </td>
                </tr>
            </table>
            </body>
        </html>`;
  }
}
