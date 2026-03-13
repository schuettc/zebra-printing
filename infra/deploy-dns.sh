#!/bin/bash

# Exit on error
set -e

# Accept environment parameter with default value of "dev"
environment="${1:-dev}"
# Accept profile parameter, if not provided use exported credentials
profile="${2}"

# Set up profile option
profile_option=""
if [ -n "$profile" ]; then
  profile_option="--profile ${profile}"
  echo "🌐 Starting DNS deployment for environment: ${environment} using AWS profile: ${profile}..."
else
  echo "🌐 Starting DNS deployment for environment: ${environment} using exported AWS credentials..."
fi

# Set domain based on environment
if [ "$environment" = "prod" ]; then
  domain="${PROD_DOMAIN_NAME:-example.com}"
else
  domain="${DEV_DOMAIN_NAME:-dev.example.com}"
fi

# Deploy DNS Stack
echo "🔧 Deploying ZebraPrinting DNS Stack (ZebraPrintingDNSStack-${environment})..."
echo "Note: This stack creates:"
echo "  - SSL certificates for auth.${domain}"
echo "  - SSL certificates for ${domain} and www.${domain}"
echo "  - SSL certificates for api.${domain}"
echo "  - Placeholder DNS records for Cognito validation"

pnpm cdk deploy ZebraPrintingDNSStack-${environment} --context environment=${environment} --exclusively ${profile_option} --require-approval never

echo ""
echo "✅ DNS deployment complete!"
echo ""
echo "📋 SSM Parameters created:"
echo "  - /${environment}/zebraprinting/dns/hostedzone/id"
echo "  - /${environment}/zebraprinting/dns/hostedzone/name"
echo "  - /${environment}/zebraprinting/dns/certificate/auth/arn"
echo "  - /${environment}/zebraprinting/dns/certificate/website/arn"
echo "  - /${environment}/zebraprinting/dns/certificate/appsync/arn"
echo ""
echo "Next steps:"
echo "  1. Wait for certificates to validate (this may take a few minutes)"
echo "  2. Run './deploy.sh ${environment}' to deploy the full application"