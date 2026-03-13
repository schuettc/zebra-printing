# Infrastructure (`infra/`)

This directory contains the AWS CDK (Cloud Development Kit) code for defining and deploying the infrastructure for the Zebra Printing web application.

## Key Files

- `src/main.ts`: The entry point for the CDK application.
- `src/stacks/`: CDK stack definitions (ZebraPrinting, Cognito, DNS).
- `src/constructs/`: Reusable CDK constructs.
- `cdk.json`: CDK toolkit configuration.
- `package.json`: Dependencies and scripts for this CDK project.
- `tsconfig.json`: TypeScript configuration.

## Available Scripts

(Run from the `infra/` directory or using `pnpm --filter infra <script>` from the root)

- `pnpm build`: Compiles TypeScript code.
- `pnpm watch`: Watches for file changes and recompiles.
- `pnpm test`: Runs tests (if any are configured).
- `pnpm cdk <cdk-command>`: Executes CDK commands (e.g., `synth`, `deploy`, `diff`, `bootstrap`).
  - Example: `pnpm cdk synth`
  - Example: `pnpm cdk deploy`
- `pnpm lint`: Lints the codebase using ESLint.
- `pnpm format`: Formats the codebase using Prettier.

Refer to the [root README.md](../README.md) for more details on project setup and deployment.
