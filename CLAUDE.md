# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based Zebra label printing application that allows users to upload ZPL files and print to network-connected Zebra printers using the Zebra Browser Print SDK. The application consists of a React frontend and AWS infrastructure managed with CDK.

## Common Development Commands

### Frontend Development

```bash
# Start development server (from root)
pnpm --filter frontend dev

# Build frontend for production
pnpm --filter frontend build

# Run linting
pnpm --filter frontend lint

# Format code
pnpm --filter frontend format

# Preview production build
pnpm --filter frontend preview
```

### Infrastructure Development

```bash
# Synthesize CloudFormation template
pnpm --filter infra cdk synth

# Deploy stack to AWS
pnpm --filter infra cdk deploy

# View stack differences
pnpm --filter infra cdk diff

# Bootstrap CDK (first time only)
pnpm --filter infra cdk bootstrap

# Run infrastructure tests
pnpm --filter infra test

# Lint infrastructure code
pnpm --filter infra lint
```

### Deployment Commands

```bash
# Deploy to dev environment
pnpm deploy:dev

# Deploy to production
pnpm deploy:prod

# Deploy with specific AWS profile
pnpm deploy:dev:profile --profile=myprofile
pnpm deploy:prod:profile --profile=myprofile

# Main deployment script (interactive)
./deploy.sh
```

### Workspace-wide Commands

```bash
# Install all dependencies
pnpm install

# Lint all packages
pnpm lint

# Format all packages
pnpm format
```

## Architecture Overview

This is a monorepo using pnpm workspaces with two main packages:

1. **Frontend** (`/frontend`): Vite-based React application with TypeScript

   - Entry point: `src/main.tsx`
   - Main component: `src/App.tsx` (ZebraPrinter component)
   - Build output: `dist/`
   - Development server runs on http://localhost:5173
   - Key components:
     - `ZebraPrinter`: Main printing interface
     - `PrinterSelector`: Printer discovery and selection
     - `ZPLUploader`: File upload and ZPL content management
     - `PrintStatus`: Print job status display
   - Services:
     - `browserPrintService`: Handles Browser Print SDK communication
     - `printerConfig`: Manages printer configuration loading

2. **Infrastructure** (`/infra`): AWS CDK infrastructure as code
   - Entry point: `src/main.ts`
   - Stack definitions:
     - `ZebraPrintingStack`: Main application stack (S3 + CloudFront)
     - `CognitoStack`: Authentication via AWS Cognito
     - `DnsStack`: Domain configuration
   - Environments: dev and prod (configured via environment variables)

## Key Technologies and Dependencies

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Infrastructure**: AWS CDK, S3, CloudFront
- **Printing**: Zebra Browser Print SDK (v3.1.250)
- **Label Format**: ZPL (Zebra Programming Language)
- **Package Manager**: pnpm (v9.5.0)

## Important Configuration

- **Printer Configurations**: `frontend/src/config/printers.{dev,prod}.json`
- **CDK Configuration**: `infra/cdk.json`
- **Browser Print SDK**: Located in `frontend/public/js/`
- **Sample ZPL Files**: `frontend/public/sample-labels/`

## Browser Print Requirements

- Zebra Browser Print must be installed on client machines
- SSL certificate must be accepted at https://localhost:9101/ssl_support
- Network printers must be accessible from client machines
- Microsoft Edge is not supported

## Additional Documentation

All documentation is in the `docs/` directory:

- `docs/PROJECT_SUMMARY.md`: Comprehensive project overview
- `docs/USER_GUIDE.md`: End-user documentation
- `docs/IT_SETUP_GUIDE.md`: Technical setup guide
- `docs/DEPLOYMENT.md`: Deployment procedures
- `docs/QUICK_START.md`: Visual quick reference
- `docs/PRINTER_CONFIGURATION.md`: Printer configuration guide
