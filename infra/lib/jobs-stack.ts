import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface JobsStackProps extends cdk.StackProps {
  key: kms.Key;
}

/**
 * JobsStack — event bus + queues for background sync (mail, calendar, financials).
 *
 * COST: EventBridge and SQS are effectively free at dev volume; no always-on
 * compute. Lambda functions attach in a later phase once handler code exists.
 *
 * SECURITY: queues are KMS-encrypted and enforce SSL. Each queue has a
 * dead-letter queue so a poisoned message can't silently vanish — important for
 * auditability of financial syncs.
 */
export class JobsStack extends cdk.Stack {
  public readonly bus: events.EventBus;
  public readonly syncQueue: sqs.Queue;
  public readonly financialsQueue: sqs.Queue;
  public readonly syncRole: iam.Role;

  constructor(scope: Construct, id: string, props: JobsStackProps) {
    super(scope, id, props);

    this.bus = new events.EventBus(this, 'OpsAgendaBus', {
      eventBusName: 'opsagenda-events',
    });

    const makeQueue = (name: string): sqs.Queue => {
      const dlq = new sqs.Queue(this, `${name}Dlq`, {
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.key,
        enforceSSL: true,
        retentionPeriod: cdk.Duration.days(14),
      });
      return new sqs.Queue(this, name, {
        encryption: sqs.QueueEncryption.KMS,
        encryptionMasterKey: props.key,
        enforceSSL: true,
        visibilityTimeout: cdk.Duration.minutes(5),
        deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
      });
    };

    this.syncQueue = makeQueue('ProductivitySyncQueue');
    this.financialsQueue = makeQueue('FinancialsSyncQueue');

    // Execution role for future sync Lambdas: least-privilege, scoped to the
    // resources this stack owns plus Bedrock inference and SSM token reads.
    this.syncRole = new iam.Role(this, 'SyncExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'OpsAgenda background sync execution role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.syncQueue.grantConsumeMessages(this.syncRole);
    this.financialsQueue.grantConsumeMessages(this.syncRole);
    props.key.grantEncryptDecrypt(this.syncRole);

    // Bedrock: invoke-only, no model management.
    this.syncRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [`arn:aws:bedrock:${this.region}::foundation-model/*`],
      }),
    );

    // Token vault: SSM Parameter Store (SecureString) instead of Secrets Manager
    // to avoid per-secret monthly charges across many tenant connections.
    this.syncRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/opsagenda/*`,
        ],
      }),
    );

    new cdk.CfnOutput(this, 'EventBusName', { value: this.bus.eventBusName });
    new cdk.CfnOutput(this, 'SyncQueueUrl', { value: this.syncQueue.queueUrl });
    new cdk.CfnOutput(this, 'FinancialsQueueUrl', { value: this.financialsQueue.queueUrl });
  }
}
