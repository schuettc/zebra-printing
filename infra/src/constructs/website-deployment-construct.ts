import { Construct } from 'constructs';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { DockerImage } from 'aws-cdk-lib';
import { execSync } from 'child_process';
import * as fsExtra from 'fs-extra';
import { Stack } from 'aws-cdk-lib';

interface WebsiteDeploymentConstructProps {
  siteBucket: IBucket;
  distribution: IDistribution;
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  identityPoolId: string;
}

export class WebsiteDeploymentConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: WebsiteDeploymentConstructProps
  ) {
    super(scope, id);

    // Create config object for the site
    const config = {
      region: props.region,
      userPoolId: props.userPoolId,
      userPoolClientId: props.userPoolClientId,
      cognitoDomain: props.cognitoDomain,
      identityPoolId: props.identityPoolId,
      siteRegion: Stack.of(this).region,
    };

    const bundle = Source.asset('../frontend', {
      bundling: {
        command: [
          'sh',
          '-c',
          'echo "Docker build not supported. Please install pnpm and other dependencies locally."',
        ],
        image: DockerImage.fromRegistry('alpine'),
        local: {
          tryBundle(outputDir: string) {
            try {
              execSync('pnpm --version', { stdio: 'ignore' });
            } catch {
              console.log('pnpm is not installed. Skipping local bundling.');
              return false;
            }

            try {
              console.log('Building frontend assets with pnpm...');
              execSync('cd ../frontend && pnpm install && pnpm build', {
                stdio: 'inherit',
              });
              console.log(
                'Copying built frontend assets to output directory...'
              );
              fsExtra.copySync('../frontend/dist', outputDir, {
                overwrite: true,
              });
              return true;
            } catch (error) {
              console.error(
                'Error during local bundling of frontend assets:',
                error
              );
              return false;
            }
          },
        },
      },
    });

    new BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [
        bundle,
        // Deploy config.json with site configuration
        Source.jsonData('config.json', config),
      ],
      destinationBucket: props.siteBucket,
      distribution: props.distribution,
      distributionPaths: ['/*'],
    });
  }
}
