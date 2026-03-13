import {
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CacheQueryStringBehavior,
  AllowedMethods,
  CachedMethods,
  SecurityPolicyProtocol,
  SSLMethod,
  HttpVersion,
  PriceClass,
  ResponseHeadersPolicy,
  HeadersFrameOption,
  HeadersReferrerPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Role, AccountRootPrincipal } from 'aws-cdk-lib/aws-iam';
import { WebsiteDeploymentConstruct } from './website-deployment-construct';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';

interface WebsiteConstructProps {
  domainName?: string; // Made optional for CloudFront default domain
  environment: 'dev' | 'prod';
  certificate?: ICertificate; // Made optional
  hostedZone?: IHostedZone; // Made optional
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  identityPoolId: string;
}

export class WebsiteConstruct extends Construct {
  public readonly distribution: Distribution;
  public readonly siteBucket: Bucket;

  constructor(scope: Construct, id: string, props: WebsiteConstructProps) {
    super(scope, id);

    this.siteBucket = new Bucket(this, 'SiteBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const internalBucketAccessRole = new Role(this, 'BucketAccessRole', {
      assumedBy: new AccountRootPrincipal(),
      description:
        'Role with R/W access to the website S3 bucket for deployment and management',
    });
    this.siteBucket.grantReadWrite(internalBucketAccessRole);

    const pagesCachePolicy = this.createPagesCachePolicy();
    const responseHeadersPolicy = this.createSecurityHeadersPolicy(
      props.domainName,
      props.region
      // props.graphqlEndpoint,
      // props.graphqlRealtimeUrl
    );

    this.distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: pagesCachePolicy,
        responseHeadersPolicy,
      },
      certificate: props.certificate,
      domainNames: props.domainName
        ? [props.domainName, `www.${props.domainName}`]
        : undefined,
      enableIpv6: true,
      httpVersion: HttpVersion.HTTP3,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      sslSupportMethod: SSLMethod.SNI,
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `CDN for ${props.domainName || 'Zebra Printing App'}`,
      defaultRootObject: 'index.html',
      enableLogging: true,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(0),
        },
      ],
    });

    new WebsiteDeploymentConstruct(this, 'Deployment', {
      siteBucket: this.siteBucket,
      distribution: this.distribution,
      region: props.region,
      userPoolId: props.userPoolId,
      userPoolClientId: props.userPoolClientId,
      cognitoDomain: props.cognitoDomain,
      identityPoolId: props.identityPoolId,
    });
  }

  private createPagesCachePolicy(): CachePolicy {
    return new CachePolicy(this, 'PagesCache', {
      minTtl: Duration.minutes(1),
      maxTtl: Duration.days(1),
      defaultTtl: Duration.hours(1),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      cookieBehavior: CacheCookieBehavior.none(),
      headerBehavior: CacheHeaderBehavior.allowList('Accept'),
      queryStringBehavior: CacheQueryStringBehavior.allowList('q', 'category'),
    });
  }

  private createSecurityHeadersPolicy(
    domainName: string | undefined,
    region: string
  ): ResponseHeadersPolicy {
    return new ResponseHeadersPolicy(this, 'SecurityHeaders', {
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob:",
            // Connect-src allows Browser Print localhost connections and Cognito endpoints
            `connect-src 'self' ${domainName ? `https://*.${domainName} wss://*.${domainName}` : ''} https://localhost:9101 http://localhost:9101 https://localhost:9100 http://localhost:9100 https://127.0.0.1:9101 http://127.0.0.1:9101 https://127.0.0.1:9100 http://127.0.0.1:9100 https://*.amazonaws.com https://*.amazoncognito.com https://cognito-idp.${region}.amazonaws.com https://cognito-identity.${region}.amazonaws.com`,
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            'upgrade-insecure-requests',
          ].join('; '),
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365 * 2),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: {
          frameOption: HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        xssProtection: { protection: true, modeBlock: true, override: true },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=()',
            override: true,
          },
        ],
      },
    });
  }
}
