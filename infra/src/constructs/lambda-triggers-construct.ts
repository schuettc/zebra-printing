import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';

interface LambdaTriggersConstructProps {
  userPool: IUserPool;
  environment: 'dev' | 'prod';
  allowedDomains: string[];
}

export class LambdaTriggersConstruct extends Construct {
  public readonly preSignupFunction: NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: LambdaTriggersConstructProps
  ) {
    super(scope, id);

    // Pre-Signup Lambda - validates email domains during registration
    this.preSignupFunction = new NodejsFunction(this, 'PreSignupFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: './src/lambda/pre-signup/index.ts',
      handler: 'handler',
      timeout: Duration.seconds(30),
      functionName: `${props.environment}-zebraprinting-pre-signup`,
      environment: {
        ALLOWED_DOMAINS: props.allowedDomains.join(','),
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
      },
    });

    // Lambda will be invoked by Cognito service, no explicit grant needed
    // The permission is automatically added when we attach the trigger to the User Pool
  }
}
