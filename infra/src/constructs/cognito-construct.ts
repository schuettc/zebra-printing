import { Construct } from 'constructs';
import {
  CfnUserPoolDomain,
  IUserPool,
  UserPoolClient,
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  OAuthScope,
  ClientAttributes,
} from 'aws-cdk-lib/aws-cognito';
import { Duration } from 'aws-cdk-lib';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Role, FederatedPrincipal } from 'aws-cdk-lib/aws-iam';
import { IHostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';

interface CognitoResourcesConstructProps {
  environment: 'dev' | 'prod';
  appDomainName: string;
  userPool: IUserPool;
}

/**
 * Creates Cognito User Pool Client, User Pool Domain, Identity Pool, and Authenticated Role for an existing UserPool.
 */
export class CognitoResourcesConstruct extends Construct {
  public readonly userPoolClient: UserPoolClient;
  public readonly identityPoolId: string;
  public readonly authenticatedRole: Role;

  constructor(
    scope: Construct,
    id: string,
    props: CognitoResourcesConstructProps
  ) {
    super(scope, id);

    // User Pool Client
    const callbackUrls = [
      `https://${props.appDomainName}/callback`,
      `https://www.${props.appDomainName}/callback`,
      'http://localhost:5173/callback',
      ...(props.environment === 'dev'
        ? ['https://oauth.pstmn.io/v1/callback']
        : []),
    ];
    const logoutUrls = [
      `https://${props.appDomainName}/signout`,
      `https://www.${props.appDomainName}/signout`,
      'http://localhost:5173/signout',
    ];

    this.userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool: props.userPool,
      userPoolClientName: `${props.environment}-ZebraPrintingWebAppClient`,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true, implicitCodeGrant: true },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: callbackUrls,
        logoutUrls: logoutUrls,
      },
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
      readAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
        emailVerified: true,
        givenName: true,
        familyName: true,
        preferredUsername: true,
      }),
      writeAttributes: new ClientAttributes().withStandardAttributes({
        email: true,
      }),
    });

    // Identity Pool
    const identityPool = new CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${props.environment}-ZebraPrintingIdentityPool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: props.userPool.userPoolProviderName,
        },
      ],
    });
    this.identityPoolId = identityPool.ref;

    // Authenticated Role for Identity Pool
    this.authenticatedRole = new Role(this, 'AuthenticatedRole', {
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPoolId,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      description: `IAM role for authenticated users of ${props.environment} ZebraPrinting`,
    });

    // Role Attachment for Identity Pool
    new CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPoolId,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
      },
    });
  }
}

interface CognitoCustomDomainConstructProps {
  /** The ID of the Cognito User Pool to add the custom domain to. */
  userPoolId: string;
  /** The ACM certificate for the custom domain. Must be in us-east-1. */
  certificate: ICertificate;
  /** The custom domain name (e.g., auth.example.com) */
  customDomainName: string;
  /** The Hosted Zone to create the ARecord in */
  hostedZone: IHostedZone;
}

/**
 * Creates a Cognito User Pool Custom Domain using the L1 CfnUserPoolDomain construct.
 * Requires the User Pool ID and an ACM Certificate (in us-east-1).
 */
export class CognitoCustomDomainConstruct extends Construct {
  public readonly domainName: string;
  public readonly cloudFrontDistributionDomainName: string;
  private readonly cfnUserPoolDomain: CfnUserPoolDomain;

  constructor(
    scope: Construct,
    id: string,
    props: CognitoCustomDomainConstructProps
  ) {
    super(scope, id);

    const domainName = props.customDomainName.replace(/^https?:\/\//, '');

    // Create the custom domain for the user pool
    this.cfnUserPoolDomain = new CfnUserPoolDomain(this, 'CustomDomain', {
      userPoolId: props.userPoolId,
      domain: domainName,
      customDomainConfig: {
        certificateArn: props.certificate.certificateArn,
      },
    });

    this.domainName = props.customDomainName;
    this.cloudFrontDistributionDomainName = this.cfnUserPoolDomain
      .getAtt('CloudFrontDistribution')
      .toString();

    // Create the A-Record internally
    // Extract just the subdomain part (e.g., 'auth' from 'auth.dev.example.com')
    const subdomainPrefix = domainName.split('.')[0];
    new ARecord(this, 'AliasRecord', {
      zone: props.hostedZone,
      recordName: subdomainPrefix, // Just 'auth', not 'auth.dev.example.com'
      target: RecordTarget.fromAlias({
        bind: () => ({
          dnsName: this.cloudFrontDistributionDomainName,
          hostedZoneId: 'Z2FDTNDATAQYW2',
        }),
      }),
    });
  }

  /**
   * Returns the full URL for the custom domain.
   */
  public get domainUrl(): string {
    return `https://${this.domainName}`;
  }
}
