import { Stack, StackProps } from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";

/**
 * The Props necessary to create an {@link SesStack}
 */
export interface SesStackProps extends StackProps {
    /**
     * Utility Tool used for creating consistent id's & names for our AWS resources.
     */
    idBuilder: InfraResourceIdBuilder;
    /**
     * This should be the main domain used for your application.
     * It will used to create a few other ses identities such as a no reply email address.
     * This should formatted as be <yourdomain>.<suffix>
     * @example myApp.com
     */
    appDomain: string;
}

/**
 * This class produces infrastructure necessary for setting email using Amazon Simple Email Service (SES).
 */
export class SesStack extends Stack {
    /**
     * The AWS SES Domain entity for the primary domain for your application
     */
    public readonly primaryAppDomainSesIdentity: ses.EmailIdentity;
    /**
     * The AWS SES email identity for your no-reply email address.
     */
    public readonly noReplyEmailInfra: {
        sesIdentity: ses.EmailIdentity;
        emailAddress: string;
    };

    constructor(scope: Construct, id: string, props: SesStackProps) {
        super(scope, id, props);

        /**
         * We have to create a "domain" identity first and from there
         * SES allows us to create multiple email domains so we can programmatically send emails.
         *
         * In most cases, creating a domain identity eliminates the need for creating and verifying individual email address identities,
         * unless you want to apply custom configurations to a specific email address.
         */
        this.primaryAppDomainSesIdentity = new ses.EmailIdentity(
            this,
            props.idBuilder.createStageBasedId(`${props.appDomain}SesIdentity`),
            {
                identity: ses.Identity.domain(props.appDomain),
            }
        );

        const noReplyEmailAddress = `no-reply@${props.appDomain}`;
        /**
         * This "no-reply" email identity will be used for sending programmatic emails.
         * When you look at the SES console, it will appear as "unverified" because we did
         * not setup an actualy inbox to click on the verification email but that is ok.
         *
         * @see https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html
         */
        const noReplySesIdentity = new ses.EmailIdentity(
            this,
            props.idBuilder.createStageBasedId(
                `${noReplyEmailAddress}SesIdentity`
            ),
            {
                identity: ses.Identity.email(noReplyEmailAddress),
            }
        );

        this.noReplyEmailInfra = {
            sesIdentity: noReplySesIdentity,
            emailAddress: noReplyEmailAddress,
        };
    }
}
