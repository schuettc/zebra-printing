import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebsiteConstruct } from '../constructs/website-construct';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { CognitoResourcesConstruct } from '../constructs/cognito-construct';

interface ZebraPrintingStackProps extends cdk.StackProps {
  domainName?: string;
  environment?: 'dev' | 'prod';
}

export class ZebraPrintingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ZebraPrintingStackProps) {
    super(scope, id, props);

    const environment = props?.environment || 'dev';
    const ssmDnsPrefix = `/${environment}/zebraprinting/dns`;
    const ssmCognitoPrefix = `/${environment}/zebraprinting/cognito`;

    // --- Read from SSM Parameters ---
    const websiteCertificateArn = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/certificate/website/arn`
    );
    const hostedZoneId = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/hostedzone/id`
    );
    const zoneName = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/hostedzone/name`
    );
    const userPoolId = StringParameter.valueForStringParameter(
      this,
      `${ssmCognitoPrefix}/user-pool-id`
    );
    const cognitoDomainName = StringParameter.valueForStringParameter(
      this,
      `${ssmCognitoPrefix}/custom-domain-name`
    );

    // --- Import resources from SSM ---
    const certificate = Certificate.fromCertificateArn(
      this,
      'ImportedWebsiteCert',
      websiteCertificateArn
    );
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'ImportedHostedZone',
      {
        hostedZoneId: hostedZoneId,
        zoneName: zoneName,
      }
    );
    const userPool = UserPool.fromUserPoolId(
      this,
      'ImportedUserPool',
      userPoolId
    );

    // Create Cognito resources (User Pool Client, Identity Pool, etc.)
    const cognitoResources = new CognitoResourcesConstruct(
      this,
      'CognitoResources',
      {
        environment: environment,
        appDomainName: props?.domainName || 'localhost:5173',
        userPool: userPool,
      }
    );

    // Create the website construct with certificate and hosted zone
    const website = new WebsiteConstruct(this, 'Website', {
      domainName: props?.domainName,
      environment: environment,
      region: this.region,
      certificate: props?.domainName ? certificate : undefined,
      hostedZone: props?.domainName ? hostedZone : undefined,
      userPoolId: userPoolId,
      userPoolClientId: cognitoResources.userPoolClient.userPoolClientId,
      cognitoDomain: cognitoDomainName,
      identityPoolId: cognitoResources.identityPoolId,
    });

    // Create DNS records if custom domain is used
    if (props?.domainName) {
      // Create A record for apex domain (replaces placeholder from DnsStack)
      new ARecord(this, 'ApexARecord', {
        zone: hostedZone,
        recordName: '', // Empty string means apex domain
        target: RecordTarget.fromAlias(
          new CloudFrontTarget(website.distribution)
        ),
        comment: 'A record for Zebra Printing CloudFront distribution',
        deleteExisting: true, // Critical: replaces the placeholder from DnsStack
      });

      // Create A record for www subdomain
      new ARecord(this, 'WwwARecord', {
        zone: hostedZone,
        recordName: 'www',
        target: RecordTarget.fromAlias(
          new CloudFrontTarget(website.distribution)
        ),
        comment: 'A record for www subdomain pointing to CloudFront',
      });
    }

    // --- Outputs ---
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${website.distribution.distributionDomainName}`,
      description:
        'CloudFront distribution URL for the Zebra Printing application',
    });

    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: website.siteBucket.bucketName,
      description: 'S3 bucket containing the website files',
    });

    if (props?.domainName) {
      new cdk.CfnOutput(this, 'CustomDomainURL', {
        value: `https://${props.domainName}`,
        description: 'Custom domain URL for the Zebra Printing application',
      });
    }

    // Output Cognito configuration for frontend
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognitoResources.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: cognitoResources.identityPoolId,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: cognitoDomainName,
      description: 'Cognito Custom Domain',
    });

    // Store Cognito config in SSM for frontend deployment
    new StringParameter(this, 'FrontendUserPoolIdParam', {
      parameterName: `/${environment}/zebraprinting/frontend/user-pool-id`,
      stringValue: userPoolId,
      description: 'User Pool ID for frontend configuration',
    });

    new StringParameter(this, 'FrontendUserPoolClientIdParam', {
      parameterName: `/${environment}/zebraprinting/frontend/user-pool-client-id`,
      stringValue: cognitoResources.userPoolClient.userPoolClientId,
      description: 'User Pool Client ID for frontend configuration',
    });

    new StringParameter(this, 'FrontendIdentityPoolIdParam', {
      parameterName: `/${environment}/zebraprinting/frontend/identity-pool-id`,
      stringValue: cognitoResources.identityPoolId,
      description: 'Identity Pool ID for frontend configuration',
    });

    new StringParameter(this, 'FrontendCognitoDomainParam', {
      parameterName: `/${environment}/zebraprinting/frontend/cognito-domain`,
      stringValue: cognitoDomainName,
      description: 'Cognito Domain for frontend configuration',
    });
  }
}
