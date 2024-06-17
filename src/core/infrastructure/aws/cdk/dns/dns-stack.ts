import { Stack, StackProps } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";

export interface SimpleDnsStackProps extends StackProps {
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
 * Produces Route53 records for website domains necessary for your application.
 */
export class SimpleDnsStack extends Stack {
  public readonly primaryAppDomainHostedZone: route53.HostedZone;
  public readonly primaryAppDomainName: route53.HostedZone;

  constructor(scope: Construct, id: string, props: SimpleDnsStackProps) {
    super(scope, id, props);

    if (props.appDomain) {
      /**
       * Creates the hozed zone for your applicatons primary domain.
       */
      this.primaryAppDomainHostedZone = new route53.HostedZone(
        this,
        `${props.appDomain}-HostedZone`,
        {
          zoneName: props.appDomain,
        }
      );
    }
  }
}
