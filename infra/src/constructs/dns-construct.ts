import { Construct } from 'constructs';
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  HostedZone,
  ARecord,
  RecordTarget,
  IHostedZone,
  CnameRecord,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';

interface DnsConstructProps {
  domainName: string;
  environment: 'dev' | 'prod';
  hostedZoneId: string;
}

export class DnsConstruct extends Construct {
  public readonly websiteCertificate: ICertificate;
  public readonly authCertificate: ICertificate;
  public readonly appSyncCertificate: ICertificate;
  public readonly hostedZone: IHostedZone;

  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    this.hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: props.domainName,
      hostedZoneId: props.hostedZoneId,
    });

    const websiteSubjectAlternativeNames = [`www.${props.domainName}`];

    this.websiteCertificate = new Certificate(this, 'WebsiteCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: websiteSubjectAlternativeNames,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    const authDomainName = `auth.${props.domainName}`;

    this.authCertificate = new Certificate(this, 'AuthCertificate', {
      domainName: authDomainName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    const appSyncDomain = `api.${props.domainName}`;
    this.appSyncCertificate = new Certificate(this, 'AppSyncCertificate', {
      domainName: appSyncDomain,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }

  /**
   * Adds A records for the root and www subdomains pointing to a CloudFront distribution.
   * @param distribution The CloudFront distribution.
   * @param domainName The domain name (e.g., example.com).
   * @returns An array containing the created ARecord constructs.
   */
  public addDistributionARecords(
    distribution: Distribution,
    domainName: string
  ): ARecord[] {
    const apexRecord = new ARecord(this, 'WebsiteApexRecord', {
      zone: this.hostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    const wwwRecord = new ARecord(this, 'WebsiteWwwRecord', {
      zone: this.hostedZone,
      recordName: `www.${domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    return [apexRecord, wwwRecord];
  }

  /**
   * Adds a CNAME record for the AppSync API custom domain.
   * @param apiSubdomain The subdomain part for the API (e.g., "api" for api.dev.example.com).
   * @param appsyncTargetDomain The target domain provided by AppSync (e.g., d-xxxx.cloudfront.net).
   * @returns The created CnameRecord construct.
   */
  public addAppSyncApiCnameRecord(
    apiSubdomain: string,
    appsyncTargetDomain: string
  ): CnameRecord {
    const record = new CnameRecord(this, 'AppSyncApiCnameRecord', {
      zone: this.hostedZone,
      recordName: apiSubdomain,
      domainName: appsyncTargetDomain,
    });
    return record;
  }
}
