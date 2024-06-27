import {
  CustomMessageForgotPasswordTriggerEvent,
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
    if (event.triggerSource === "CustomMessage_SignUp") {
      await this.handleSignUp(event);
      return event;
    } else if (event.triggerSource === "CustomMessage_ResendCode") {
      await this.handleResendCode(event);
      return event;
    } else if (event.triggerSource === "CustomMessage_ForgotPassword") {
      await this.handleResetPasswordCode(event);
    }

    return event;
  }

  /**
   * Handles a incoming new Sign Up event from AWS Cognito, customizing the email subject and body that gets send to the end user
   */
  private async handleSignUp(event: CustomMessageSignUpTriggerEvent) {
    const loggedEvent = { ...event };
    loggedEvent.request.clientMetadata!["rawPassword"] = "***"; // we need to redact this from our logs.
    console.log("recieved sign up event: ", loggedEvent);

    event.response.emailSubject = `Welcome to ${AWS_INFRA_CONFIG.appName}`;
    event.response.emailMessage = this.createWelcomeVerifyCodeEmailTemplate({
      firstName: event.request.userAttributes.given_name,
      verifyCodeLink: `${process.env.FRONT_END_VERIFY_CODE_URL}?email=${event.request.userAttributes.email}&code=${event.request.codeParameter}`,
      appName: AWS_INFRA_CONFIG.appName,
      companyName: AWS_INFRA_CONFIG.appName,
    });
  }

  /**
   * Handles a incoming new forgot password event from AWS Cognito, customizing the email subject and body that gets send to the end user
   */
  private async handleResetPasswordCode(
    event: CustomMessageForgotPasswordTriggerEvent
  ) {
    console.log("recieved forgot password event: ", event);

    event.response.emailSubject = `Your ${AWS_INFRA_CONFIG.appName} Password Reset Code`;
    event.response.emailMessage = this.createResetPasswordCodeEmailTemplate({
      firstName: event.request.userAttributes.given_name,
      verifyCodeLink: `${process.env.FRONT_END_RESET_PASSWORD_CODE_URL}?email=${event.request.userAttributes.email}&code=${event.request.codeParameter}`,
      code: event.request.codeParameter,
      appName: AWS_INFRA_CONFIG.appName,
      companyName: AWS_INFRA_CONFIG.appName,
    });
  }

  /**
   * Handles a incoming new resend code event from AWS Cognito, customizing the email subject and body that gets send to the end user
   */
  private async handleResendCode(event: CustomMessageResendCodeTriggerEvent) {
    console.log("recieved resend code event: ", event);

    event.response.emailSubject = `Your ${AWS_INFRA_CONFIG.appName} Account Verification Link`;
    event.response.emailMessage = this.createWelcomeVerifyCodeEmailTemplate({
      firstName: event.request.userAttributes.given_name,
      verifyCodeLink: `${
        process.env.FRONT_END_VERIFY_CODE_URL
      }?email${encodeURIComponent(event.request.userAttributes.email)}&code=${
        event.request.codeParameter
      }`,
      appName: AWS_INFRA_CONFIG.appName,
      companyName: AWS_INFRA_CONFIG.appName,
    });
  }

  private createResetPasswordCodeEmailTemplate(params: {
    firstName?: string;
    verifyCodeLink: string;
    code: string;
    appName: string;
    companyName: string;
  }) {
    return `<!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            ${BasicCognitoCustomMessageEventHandler.getSharedEmailTemplateStyles()}
            </head>
            <body>
                <table role="presentation">
                    <tr>
                        <td class="header">
                            <h1>Your ${params.appName} Password Reset</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            <h2>Hi ${params.firstName ?? ""},</h2>
                            <p>Your password reset code is: <strong>${
                              params.code
                            } </strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td class="linkButtonContent" style="text-align: center;">
                            <a class='linkButton' href="${
                              params.verifyCodeLink
                            }">Verify your account
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            <p>Regards,</p>
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
           ${BasicCognitoCustomMessageEventHandler.getSharedEmailTemplateStyles()}
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
                            <p>We're excited to have you onboard. Lets start building your future. Please click this link to verify your account. </p>
                    </td>
                </tr>
                <tr>
                    <td class="linkButtonContent" style="text-align: center;">
                        <a class='linkButton' href="${
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

  private static getSharedEmailTemplateStyles() {
    return ` <style>
        body, table, td, a {
            font-family: Arial, sans-serif;
        }
        body {
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #F9F6F0;
            box-shadow: 0 4px 8px 0;
        }
        .header {
            padding: 15px;
            padding-left: 40px;
            padding-right: 40px;
            font-size: 12.5px;
            text-align: center;
        }
        .content {
            padding-bottom: 40px;
            padding-left: 40px;
            padding-right: 40px;
            line-height: 1.6;
            color: #000;
            font-size: 16px;
        }
        .footer {
        
            color: black !important;
            padding: 25px;
            padding-left: 40px;
            padding-right: 40px;
            font-size: 14px;
        } 
        .linkButtonContent {
            padding-left: 40px;
            padding-right: 40px;
            line-height: 1.6;
            color: #FFF;
            font-size: 16px;
        }
        .linkButton {
            background-color: #8147be;
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
        </style>`;
  }
}
