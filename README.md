# Zebra Printing Web Application

A web application for printing labels to network-connected Zebra printers using the [Zebra Browser Print SDK](https://www.zebra.com/us/en/support-downloads/printer-software/by-request-software.html). Deployed to AWS using S3 and CloudFront with no backend required.

## Features

- **ZPL Printing**: Upload `.zpl` files or paste ZPL content to print labels
- **Printer Discovery**: Automatic discovery of local and network printers via Browser Print
- **Configured Printers**: Pre-configure known printers in JSON files
- **Real-time Status**: Connection and printing status feedback
- **Sample Labels**: Built-in sample ZPL for testing
- **Environment Support**: Separate dev/prod configurations

## Project Structure

This is a monorepo managed with pnpm workspaces:

- `frontend/` — Vite + React + TypeScript application
- `infra/` — AWS CDK infrastructure (S3 + CloudFront)

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- [pnpm](https://pnpm.io/) (v9+)
- [AWS CLI](https://aws.amazon.com/cli/) (configured for CDK deployment)
- [Zebra Browser Print](https://www.zebra.com/us/en/support-downloads/printer-software/by-request-software.html) installed on client machines

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd zebra-printing
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure the application:**

   Copy the example config and fill in your AWS Cognito values:

   ```bash
   cp frontend/public/config.example.json frontend/public/config.json
   ```

4. **Configure printers:**

   Edit `frontend/src/config/printers.json` with your printer details:

   ```json
   {
     "printers": [
       {
         "id": "my-printer",
         "name": "Lab Printer",
         "ip": "192.168.1.100",
         "port": 9100,
         "location": "Lab",
         "description": "Main lab printer",
         "model": "ZD421CN"
       }
     ]
   }
   ```

5. **Start the development server:**

   ```bash
   pnpm --filter frontend dev
   ```

   The app runs at `http://localhost:5173`.

## Browser Print Setup

1. Install Zebra Browser Print on client machines
2. Accept the SSL certificate at `https://localhost:9101/ssl_support`
3. Ensure network printers are accessible from client machines

> **Note:** Microsoft Edge is not supported by the Browser Print SDK.

## Deployment

```bash
# Deploy to dev environment
pnpm deploy:dev

# Deploy to production
pnpm deploy:prod

# With a specific AWS profile
pnpm deploy:prod:profile --profile=myprofile
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment procedures.

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — End-user documentation
- [docs/QUICK_START.md](docs/QUICK_START.md) — Visual quick reference
- [docs/IT_SETUP_GUIDE.md](docs/IT_SETUP_GUIDE.md) — Technical setup for IT administrators
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment procedures
- [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) — Architecture overview
- [docs/PRINTER_CONFIGURATION.md](docs/PRINTER_CONFIGURATION.md) — Printer configuration guide

## License

[MIT](LICENSE)
