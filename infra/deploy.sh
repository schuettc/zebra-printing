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
  echo "🏗️  Starting deployment process for environment: ${environment} using AWS profile: ${profile}..."
else
  echo "🏗️  Starting deployment process for environment: ${environment} using exported AWS credentials..."
fi

# Copy environment-specific printer configuration
echo "📋 Setting up environment-specific printer configuration..."
cp "../frontend/src/config/printers.${environment}.json" "../frontend/src/config/printers.json"
echo "✅ Using printers.${environment}.json for this deployment"

# Step 1: Deploy Cognito Stack
echo "🔐 Deploying ZebraPrinting Cognito Stack (ZebraPrintCognitoStack-${environment})..."
pnpm cdk deploy ZebraPrintCognitoStack-${environment} --context environment=${environment} --exclusively ${profile_option} --require-approval never

# Step 2: Deploy Main Application Stack
echo "📱 Deploying ZebraPrinting Main Stack (ZebraPrintingStack-${environment})..."
pnpm cdk deploy ZebraPrintingStack-${environment} --context environment=${environment} --exclusively ${profile_option} --require-approval never

# Get the SiteBucketName from CloudFormation outputs (updated stack name)
echo "⬇️  Fetching SiteBucketName from CloudFormation outputs..."
if [ -n "$profile" ]; then
  SITE_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name ZebraPrintingStack-${environment} --region us-east-1 --profile "${profile}" --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)
else
  SITE_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name ZebraPrintingStack-${environment} --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)
fi

if [ -z "$SITE_BUCKET_NAME" ]; then
  echo "❌ Error: Could not retrieve SiteBucketName from CloudFormation outputs."
  exit 1
fi
echo "🪣  SiteBucketName: $SITE_BUCKET_NAME"

# Copy config.json from S3 to site/public
echo "📄 Copying config.json from s3://${SITE_BUCKET_NAME}/config.json to ../frontend/public/config.json..."
if [ -n "$profile" ]; then
  aws s3 cp "s3://${SITE_BUCKET_NAME}/config.json" "../frontend/public/config.json" --region us-east-1 --profile "${profile}"
else
  aws s3 cp "s3://${SITE_BUCKET_NAME}/config.json" "../frontend/public/config.json" --region us-east-1
fi

# Conditionally copy to config.dev.json or config.prod.json
if [ "$environment" == "dev" ]; then
  cp "../frontend/public/config.json" "../frontend/public/config.dev.json"
elif [ "$environment" == "prod" ]; then
  cp "../frontend/public/config.json" "../frontend/public/config.prod.json"
fi

# Get CloudFront URL
echo "🌐 Fetching CloudFront URL..."
if [ -n "$profile" ]; then
  CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ZebraPrintingStack-${environment} --region us-east-1 --profile "${profile}" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)
else
  CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ZebraPrintingStack-${environment} --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)
fi

echo "✅ Deployment complete for environment: ${environment}!"
echo "🏗️  ZebraPrinting Architecture deployed:"
echo "   Stacks:"
echo "   1. ZebraPrintCognitoStack-${environment} (User Pool & Custom Domain)"
echo "   2. ZebraPrintingStack-${environment} (Main Application)"
echo ""
echo "   Note: DNS stack should be deployed separately using deploy-dns.sh"
echo ""
echo "   Configuration:"
echo "   - Environment: ${environment}"
echo "   - CloudFront URL: ${CLOUDFRONT_URL}"
echo "   - Printer Config: printers.${environment}.json"
