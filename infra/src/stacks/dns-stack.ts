import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export interface DnsStackProps extends StackProps {
  environment: 'dev' | 'prod';
  /** The domain name (e.g., example.com or dev.example.com) */
  domainName: string;
  /** The ID of the Hosted Zone for the domainName */
  hostedZoneId: string;
}

export class DnsStack extends Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    const authDomain = `auth.${props.domainName}`;
    const authCertificate = new Certificate(this, 'AuthCertificate', {
      domainName: authDomain,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const websiteCertificate = new Certificate(this, 'WebsiteCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: CertificateValidation.fromDnsMultiZone({
        [props.domainName]: hostedZone,
        [`www.${props.domainName}`]: hostedZone,
      }),
    });

    const apiDomain = `api.${props.domainName}`;
    const appSyncCertificate = new Certificate(this, 'AppSyncCertificate', {
      domainName: apiDomain,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Create placeholder A record for base domain (required for Cognito custom domain validation)
    // DEPLOYMENT STRATEGY:
    // 1. DnsStack creates certificates and this placeholder A record
    // 2. CognitoStack validates the domain exists (via this placeholder)
    // 3. ZebraPrintingStack replaces this placeholder with the actual CloudFront distribution
    //
    // IMPORTANT: Both this record and the one in ZebraPrintingStack use deleteExisting: true
    // This ensures smooth deployment without DNS conflicts
    new ARecord(this, 'BaseDomainPlaceholder', {
      zone: hostedZone,
      recordName: '', // Empty string means apex domain
      target: RecordTarget.fromIpAddresses('192.0.2.1'), // RFC5737 test IP - safe placeholder
      comment:
        'Placeholder A record for Cognito custom domain validation - will be replaced by CloudFront',
      deleteExisting: true, // Allow overwriting existing records
    });

    // --- Write to SSM Parameters ---
    const ssmParameterPrefix = `/${props.environment}/zebraprinting/dns`;

    new StringParameter(this, 'HostedZoneIdParam', {
      parameterName: `${ssmParameterPrefix}/hostedzone/id`,
      stringValue: hostedZone.hostedZoneId,
      description: `Hosted Zone ID for ${props.environment} ZebraPrinting DNS`,
    });
    new StringParameter(this, 'ZoneNameParam', {
      parameterName: `${ssmParameterPrefix}/hostedzone/name`,
      stringValue: hostedZone.zoneName,
      description: `Zone Name for ${props.environment} ZebraPrinting DNS`,
    });
    new StringParameter(this, 'AuthCertArnParam', {
      parameterName: `${ssmParameterPrefix}/certificate/auth/arn`,
      stringValue: authCertificate.certificateArn,
      description: `Auth Certificate ARN for ${props.environment} ZebraPrinting`,
    });
    new StringParameter(this, 'WebsiteCertArnParam', {
      parameterName: `${ssmParameterPrefix}/certificate/website/arn`,
      stringValue: websiteCertificate.certificateArn,
      description: `Website Certificate ARN for ${props.environment} ZebraPrinting`,
    });
    new StringParameter(this, 'AppSyncCertArnParam', {
      parameterName: `${ssmParameterPrefix}/certificate/appsync/arn`,
      stringValue: appSyncCertificate.certificateArn,
      description: `AppSync Certificate ARN for ${props.environment} ZebraPrinting`,
    });

    // --- CloudFormation Outputs (for visibility) ---
    new CfnOutput(this, 'OutputHostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Hosted Zone ID',
    });
    new CfnOutput(this, 'OutputZoneName', {
      value: hostedZone.zoneName,
      description: 'Hosted Zone Name',
    });
    new CfnOutput(this, 'OutputAuthCertificateArn', {
      value: authCertificate.certificateArn,
      description: 'Auth Subdomain Certificate ARN',
    });
    new CfnOutput(this, 'OutputWebsiteCertificateArn', {
      value: websiteCertificate.certificateArn,
      description: 'Website Certificate ARN',
    });
    new CfnOutput(this, 'OutputAppSyncCertificateArn', {
      value: appSyncCertificate.certificateArn,
      description: 'AppSync API Certificate ARN',
    });
  }
}
