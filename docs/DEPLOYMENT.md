# Deployment Guide

## Overview

This application supports separate development and production deployments with environment-specific printer configurations.

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. AWS CDK bootstrapped in your target region
3. Node.js 18+ and pnpm installed
4. Zebra Browser Print SDK files in `frontend/public/js/`

## Environment Configuration

### Printer Configurations

Each environment has its own printer configuration file:

- **Development**: `frontend/src/config/printers.dev.json`
- **Production**: `frontend/src/config/printers.prod.json`

The deployment process automatically selects the correct configuration based on the environment.

## Deployment Commands

### Quick Deploy

```bash
# Deploy to development (default)
pnpm deploy

# Deploy to development explicitly
pnpm deploy:dev

# Deploy to production
pnpm deploy:prod
```

### Deploy with AWS Profile

If you use AWS profiles:

```bash
# Deploy to dev with profile
pnpm deploy:dev:profile --profile=myprofile

# Deploy to prod with profile
pnpm deploy:prod:profile --profile=myprofile
```

### Manual Deployment

```bash
# Using the deploy script directly
./deploy.sh dev              # Deploy to dev
./deploy.sh prod             # Deploy to prod
./deploy.sh dev myprofile    # Deploy to dev with AWS profile
```

## CDK Commands

### Synthesize CloudFormation

```bash
# Synthesize for dev
pnpm cdk:synth:dev

# Synthesize for prod
pnpm cdk:synth:prod
```

### View Stack Differences

```bash
# Diff for dev
pnpm cdk:diff:dev

# Diff for prod
pnpm cdk:diff:prod
```

## What Gets Deployed

Each deployment creates:

- **Stack Name**: `ZebraPrintingStack-{environment}`
- **S3 Bucket**: For static website hosting
- **CloudFront Distribution**: CDN for global access
- **Security Headers**: Configured for Browser Print

## Environment-Specific Features

### Development Environment

- Test printer configurations
- May include local/USB printers
- Typically uses internal dev network IPs
- Example: `192.168.x.x` addresses

### Production Environment

- Production printer configurations
- Only verified network printers
- Uses production network IPs
- Example: `10.0.x.x` addresses

## Post-Deployment

After deployment, you'll see:

```
✅ Deployment Complete!
================================
Environment: prod
Stack Name: ZebraPrintingStack-prod
Application URL: https://d1234567890.cloudfront.net
S3 Bucket: zebraprinting-prod-bucket
Printer Config: printers.prod.json

Configured Printers:
  - Main Shipping Printer (10.0.1.100:9100) - Shipping Department
  - Warehouse A Printer (10.0.1.101:9100) - Warehouse A - Receiving
  - Warehouse B Printer (10.0.1.102:9100) - Warehouse B - Packaging
```

## Updating Printer Configurations

To update printer configurations:

1. Edit the appropriate config file:

   - `frontend/src/config/printers.dev.json` for development
   - `frontend/src/config/printers.prod.json` for production

2. Redeploy:
   ```bash
   pnpm deploy:dev   # or deploy:prod
   ```

## Rollback

To rollback a deployment:

1. Via AWS Console:

   - Go to CloudFormation
   - Select stack `ZebraPrintingStack-{environment}`
   - Choose "Update" → "Replace current template"
   - Select previous version

2. Via CDK (if you have the previous version):
   ```bash
   git checkout previous-commit
   pnpm deploy:prod
   ```

## Monitoring

### CloudWatch Metrics

- CloudFront distribution metrics
- S3 bucket access logs

### Application Logs

- Browser Print logs are local to each client machine
- No server-side logs (static application)

## Troubleshooting

### Deployment Fails

1. **Stack already exists**:

   ```bash
   # Delete the stack first
   aws cloudformation delete-stack --stack-name ZebraPrintingStack-dev
   ```

2. **CDK not bootstrapped**:

   ```bash
   pnpm --filter infra cdk bootstrap
   ```

3. **Invalid printer config**:
   - Check JSON syntax in printer config files
   - Validate IP addresses and ports

### Can't Access Application

1. **CloudFront not ready**:

   - Wait 15-20 minutes for global distribution
   - Check CloudFront console for status

2. **Browser cache**:
   - Clear browser cache
   - Try incognito/private mode

## Best Practices

1. **Always test in dev first**
2. **Review printer configs before production deployment**
3. **Use AWS profiles for different accounts/regions**
4. **Tag resources appropriately** (automatic with our setup)
5. **Monitor CloudFront costs** for high-traffic scenarios

## CI/CD Integration

This project includes GitHub Actions workflows for automated deployments using OIDC authentication (no static credentials):

- `.github/workflows/deploy-dev.yml` — deploys on push to `develop`
- `.github/workflows/deploy-prod.yml` — deploys on push to `main`

Required GitHub repository secrets:

- `AWS_ROLE_ARN_DEV` / `AWS_ROLE_ARN_PROD` — IAM role ARNs for OIDC
- `AWS_REGION` — target AWS region
- `AWS_ACCOUNT_ID` — AWS account ID
