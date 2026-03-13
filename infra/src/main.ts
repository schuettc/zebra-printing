#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ZebraPrintingStack } from './stacks/zebra-printing-stack';
import { CognitoStack } from './stacks/cognito-stack';
import { DnsStack } from './stacks/dns-stack';

const app = new cdk.App();

const environments = {
  prod: {
    domainName: process.env.PROD_DOMAIN_NAME || 'example.com',
    environment: 'prod' as const,
    hostedZoneId: process.env.PROD_HOSTED_ZONE_ID || '',
    allowedEmailDomains: (
      process.env.PROD_ALLOWED_EMAIL_DOMAINS || 'example.com'
    ).split(','),
  },
  dev: {
    domainName: process.env.DEV_DOMAIN_NAME || 'dev.example.com',
    environment: 'dev' as const,
    hostedZoneId: process.env.DEV_HOSTED_ZONE_ID || '',
    allowedEmailDomains: (
      process.env.DEV_ALLOWED_EMAIL_DOMAINS || 'example.com'
    ).split(','),
  },
};

const envKey = app.node.tryGetContext('environment') || 'dev';
const selectedEnv =
  environments[envKey as keyof typeof environments] || environments.dev; // Default to dev

if (!selectedEnv.hostedZoneId) {
  throw new Error(
    `Hosted Zone ID not configured for ${envKey} environment. ` +
      `Set ${envKey.toUpperCase()}_HOSTED_ZONE_ID environment variable.`
  );
}

// Common AWS environment config
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1', // Ensure this is us-east-1 if certificates are validated here
};

new DnsStack(app, `ZebraPrintingDNSStack-${selectedEnv.environment}`, {
  environment: selectedEnv.environment,
  domainName: selectedEnv.domainName,
  hostedZoneId: selectedEnv.hostedZoneId,
  env: awsEnv,
});

new CognitoStack(app, `ZebraPrintCognitoStack-${selectedEnv.environment}`, {
  environment: selectedEnv.environment,
  domainName: selectedEnv.domainName, // Base domain for auth subdomain construction
  allowedEmailDomains: selectedEnv.allowedEmailDomains,
  env: awsEnv,
});
// Create stack with environment suffix
new ZebraPrintingStack(app, `ZebraPrintingStack-${selectedEnv.environment}`, {
  environment: selectedEnv.environment,
  domainName: selectedEnv.domainName,
  env: awsEnv,
});
