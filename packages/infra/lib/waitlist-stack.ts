import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface WaitlistStackProps extends cdk.StackProps {
  /** Origins allowed to POST to the waitlist Function URL. */
  readonly allowedOrigins: string[];
}

/**
 * Waitlist signup backend for the marketing site — a DynamoDB table plus a
 * Lambda behind a Function URL. Independent lifecycle from the app stack and
 * the marketing static-site stack; the marketing site consumes the Function
 * URL at build time via NEXT_PUBLIC_WAITLIST_ENDPOINT. No API Gateway
 * precedent exists elsewhere in this repo, and a Function URL is the
 * simplest, cheapest option for a single POST endpoint.
 */
export class WaitlistStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WaitlistStackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'WaitlistTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // The only copy of real early-access leads — don't let a stack teardown delete it.
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const signupFunction = new NodejsFunction(this, 'SignupFunction', {
      entry: path.join(__dirname, '../lambda/waitlist-signup/index.ts'),
      // The repo root has both pnpm-lock.yaml (authoritative) and a stray
      // package-lock.json — point bundling at the real lockfile explicitly
      // rather than letting it guess.
      depsLockFilePath: path.join(__dirname, '../../../pnpm-lock.yaml'),
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      description: 'Validates and records marketing-site waitlist signups',
      environment: {
        WAITLIST_TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(signupFunction);

    const functionUrl = signupFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: props.allowedOrigins,
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ['content-type'],
      },
    });

    new cdk.CfnOutput(this, 'WaitlistFunctionUrl', {
      value: functionUrl.url,
      description: 'Set as NEXT_PUBLIC_WAITLIST_ENDPOINT before building the marketing site',
    });

    new cdk.CfnOutput(this, 'WaitlistTableName', {
      value: table.tableName,
      description: 'DynamoDB table storing waitlist signups',
    });
  }
}
