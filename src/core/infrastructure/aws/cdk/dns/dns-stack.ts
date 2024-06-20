import { Stack, StackProps } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { InfraResourceIdBuilder } from "../../../common/InfraResourceIdBuilder";

export interface SingleDomainDnsStackProps {
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
 * Produces Route53 DNS records to enable a single domain.
 */
export class SingleDomainDnsStack extends Stack {
  public readonly domainHostedZone: route53.HostedZone;

  constructor(
    scope: Construct,
    id: string,
    awsStackProps: StackProps,
    props: SingleDomainDnsStackProps
  ) {
    super(scope, id, awsStackProps);

    /**
     * Creates the hozed zone for your applicatons primary domain.
     */
    this.domainHostedZone = new route53.HostedZone(
      this,
      `${props.appDomain}-HostedZone`,
      {
        zoneName: props.appDomain,
      }
    );
  }
}

export interface SubdomainDnsStackProps {
  /**
   * Utility Tool used for creating consistent id's & names for our AWS resources.
   */
  idBuilder: InfraResourceIdBuilder;
  /**
   * The hosted zone of the parent domain
   *
   * @example myApp.com
   */
  parentDomainHostedZone: route53.HostedZone;
  /**
   * The name of the desired subdomain.
   * @example beta.myApp.com
   */
  subDomainName: string;
}

/**
 * Produces Route53 DNS records to enable a subdomain.
 */
export class SubdomainDnsStack extends Stack {
  public readonly subDomainHostedZone: route53.HostedZone;

  constructor(
    scope: Construct,
    id: string,
    awsStackProps: StackProps,
    props: SubdomainDnsStackProps
  ) {
    super(scope, id, awsStackProps);

    // 1. Create a hosted zone for our subdomain e.g. acme.example.com
    this.subDomainHostedZone = new route53.HostedZone(
      this,
      `${props.subDomainName}-HostedZone`,
      {
        zoneName: props.subDomainName,
      }
    );

    // 2. Insert the name server (NS) records from the subdomain hosted zone into the primary hosted zone.
    // This is required to get a subdomain working properly.
    new route53.NsRecord(
      this,
      `${props.subDomainName}-ParentHostedZoneNsRecord`,
      {
        zone: props.parentDomainHostedZone,
        recordName: this.subDomainHostedZone.zoneName,
        values: this.subDomainHostedZone.hostedZoneNameServers!,
      }
    );
  }
}
