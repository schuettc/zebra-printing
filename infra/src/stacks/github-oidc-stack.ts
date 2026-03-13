import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Role,
  WebIdentityPrincipal,
  PolicyStatement,
  Effect,
  OpenIdConnectProvider,
} from 'aws-cdk-lib/aws-iam';

export interface GitHubOidcStackProps extends StackProps {
  /** GitHub org/repo (e.g., 'schuettc/zebra-printing') */
  githubRepo: string;
}

export class GitHubOidcStack extends Stack {
  public readonly role: Role;

  constructor(scope: Construct, id: string, props: GitHubOidcStackProps) {
    super(scope, id, props);

    // Import the existing OIDC provider (already created by BlogOidcStack)
    const provider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubProvider',
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
    );

    // Create the GitHub Actions role
    this.role = new Role(this, 'GitHubActionsRole', {
      roleName: 'github-actions-zebra-printing',
      description: `GitHub Actions OIDC role for ${props.githubRepo}`,
      assumedBy: new WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:*`,
        },
      }),
    });

    // Allow assuming CDK bootstrap roles (these have the actual deploy permissions)
    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'AssumeBootstrapRoles',
        effect: Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    // CloudFormation permissions for CDK deployments
    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'CloudFormation',
        effect: Effect.ALLOW,
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:GetTemplate',
          'cloudformation:ListStacks',
        ],
        resources: ['*'],
      })
    );

    // SSM read access for looking up parameters during synth/deploy
    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'SSMRead',
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/*/zebraprinting/*`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/*`,
        ],
      })
    );

    new CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.role.roleArn,
      description: 'ARN of the GitHub Actions role for zebra-printing',
      exportName: 'ZebraPrintingGitHubActionsRoleArn',
    });
  }
}
