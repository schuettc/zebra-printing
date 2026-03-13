import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {
  UserPool,
  AccountRecovery,
  Mfa,
  UserPoolOperation,
} from 'aws-cdk-lib/aws-cognito';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { CognitoCustomDomainConstruct } from '../constructs/cognito-construct';
import { LambdaTriggersConstruct } from '../constructs/lambda-triggers-construct';

export interface CognitoStackProps extends StackProps {
  environment: 'dev' | 'prod';
  /** The base domain name (e.g., example.com or dev.example.com) */
  domainName: string;
  /** Allowed email domains for self-registration (e.g., ['company.com']) */
  allowedEmailDomains?: string[];
}

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const ssmDnsPrefix = `/${props.environment}/zebraprinting/dns`;
    const ssmCognitoPrefix = `/${props.environment}/zebraprinting/cognito`;

    // --- Read from SSM (DNS parameters) ---
    const authCertificateArn = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/certificate/auth/arn`
    );
    const hostedZoneId = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/hostedzone/id`
    );
    const zoneName = StringParameter.valueForStringParameter(
      this,
      `${ssmDnsPrefix}/hostedzone/name`
    );

    const authCertificate = Certificate.fromCertificateArn(
      this,
      'ImportedAuthCert',
      authCertificateArn
    );
    const importedHostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'ImportedHostedZone',
      {
        hostedZoneId: hostedZoneId,
        zoneName: zoneName,
      }
    );

    // --- User Pool ---
    const userPool = new UserPool(this, 'ZebraPrintingUserPool', {
      userPoolName: `${props.environment}-zebraprinting-pool`,
      selfSignUpEnabled: true, // Enable self-signup with domain restrictions
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
    });

    // --- Lambda Triggers for Domain Validation ---
    const allowedDomains = props.allowedEmailDomains || ['example.com'];
    const lambdaTriggers = new LambdaTriggersConstruct(this, 'LambdaTriggers', {
      userPool,
      environment: props.environment,
      allowedDomains,
    });

    // Add pre-signup trigger to validate email domains
    userPool.addTrigger(
      UserPoolOperation.PRE_SIGN_UP,
      lambdaTriggers.preSignupFunction
    );

    // --- Cognito Custom Domain ---
    const customAuthDomainName = `auth.${props.domainName}`;
    const cognitoDomainConstruct = new CognitoCustomDomainConstruct(
      this,
      'CognitoCustomDomain',
      {
        userPoolId: userPool.userPoolId,
        certificate: authCertificate,
        customDomainName: customAuthDomainName,
        hostedZone: importedHostedZone,
      }
    );
    const cognitoCustomDomainNameValue = cognitoDomainConstruct.domainName;

    // --- Write to SSM Parameters (Cognito parameters) ---
    const userPoolIdParamName = `${ssmCognitoPrefix}/user-pool-id`;
    new StringParameter(this, 'UserPoolIdParameter', {
      parameterName: userPoolIdParamName,
      stringValue: userPool.userPoolId,
      description: `Cognito User Pool ID for ${props.environment} ZebraPrinting`,
    });

    new StringParameter(this, 'CognitoDomainNameParam', {
      parameterName: `${ssmCognitoPrefix}/custom-domain-name`,
      stringValue: cognitoCustomDomainNameValue,
      description: `Cognito Custom Domain Name for ${props.environment} ZebraPrinting`,
    });

    new StringParameter(this, 'AllowedDomainsParam', {
      parameterName: `${ssmCognitoPrefix}/allowed-domains`,
      stringValue: allowedDomains.join(','),
      description: `Allowed email domains for ${props.environment} ZebraPrinting`,
    });

    // --- CloudFormation Outputs (for visibility) ---
    new CfnOutput(this, 'OutputUserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
    new CfnOutput(this, 'OutputCognitoCustomDomainName', {
      value: cognitoCustomDomainNameValue,
      description: 'Cognito Custom Domain Name',
    });
    new CfnOutput(this, 'OutputUserPoolIdSsmParamName', {
      value: userPoolIdParamName,
      description: 'SSM Parameter name for User Pool ID',
    });
    new CfnOutput(this, 'OutputCognitoDomainSsmParamName', {
      value: `${ssmCognitoPrefix}/custom-domain-name`,
      description: 'SSM Parameter name for Cognito Custom Domain',
    });
    new CfnOutput(this, 'OutputAllowedDomains', {
      value: allowedDomains.join(','),
      description: 'Allowed email domains for self-registration',
    });
  }
}
