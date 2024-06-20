import { Stack, StackProps } from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";
import * as route53 from "aws-cdk-lib/aws-route53";

/**
 * The Props necessary to create an {@link EmailStack}
 */
export interface EmailStackProps {
  /**
   * Utility Tool used for creating consistent id's & names for our AWS resources.
   */
  idBuilder: InfraResourceIdBuilder;
  /**
   * The AWS Route53 hosted zone to use as the domain for your application.
   * DKIM records will automatically be added to tise hosted zone which will verify the email identity
   * and enable emails to be sent.
   */
  emailDomainHostedZone: route53.HostedZone;
}

/**
 * This class produces infrastructure necessary for setting email using Amazon Simple Email Service (SES).
 */
export class EmailStack extends Stack {
  /**
   * The AWS SES Domain identity created using the provided email domain hosted zone.
   */
  public readonly domainSesIdentity: ses.EmailIdentity;

  constructor(
    scope: Construct,
    id: string,
    awsProps: StackProps,
    props: EmailStackProps
  ) {
    super(scope, id, awsProps);

    const { idBuilder, emailDomainHostedZone } = props;

    // Our custom 'mail from' domain, tldr is this increases email deliverability and trust.
    // Read more: https://docs.aws.amazon.com/ses/latest/dg/mail-from.html
    const mailFromDomain = `mail.${emailDomainHostedZone.zoneName}`;

    /**
     * By creating "domain" SES identity and verifying it, we can easily create email idenities using this domain
     * that will be automatically verified. By using the {@link ses.Identity.publicHostedZone} function we can automate
     * the process of verifying the domain where specific DNS records specified by AWS SES need to be added to the hosted zone.
     */
    this.domainSesIdentity = new ses.EmailIdentity(
      this,
      idBuilder.createStageBasedId(
        `${emailDomainHostedZone.zoneName}SesIdentity`
      ),
      {
        identity: ses.Identity.publicHostedZone(emailDomainHostedZone),
        mailFromDomain: mailFromDomain,
      }
    );

    /**
     *  The following MX and TXT DNS records will verify and enable our custom 'mailFromDomain'.
     *  If you do not set this then emails we send will say something along the lines of 'mailed-by: amazonses.com'
     *  when you check the sender details. We want to do this step to enhance the devliverability of our emails.
     */
    new route53.MxRecord(
      this,
      idBuilder.createStageBasedId(
        `${props.emailDomainHostedZone.zoneName}SesDomainIdentityMxRecord`
      ),
      {
        zone: props.emailDomainHostedZone,
        recordName: mailFromDomain,
        values: [
          {
            hostName: `feedback-smtp.${awsProps.env!.region}.amazonses.com`,
            priority: 10,
          },
        ],
      }
    );
    new route53.TxtRecord(
      this,
      idBuilder.createStageBasedId(
        `${props.emailDomainHostedZone.zoneName}SesDomainIdentityTxtRecord`
      ),
      {
        zone: props.emailDomainHostedZone,
        recordName: mailFromDomain,
        values: ["v=spf1 include:amazonses.com ~all"],
      }
    );
  }
}
