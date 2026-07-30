import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class Queue extends Construct {
  public readonly syncQueue: sqs.IQueue;
  public readonly syncDeadLetterQueue: sqs.IQueue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.syncDeadLetterQueue = new sqs.Queue(this, 'SyncDlq', {
      queueName: `${cdk.Stack.of(this).stackName}-sync-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.syncQueue = new sqs.Queue(this, 'SyncQueue', {
      queueName: `${cdk.Stack.of(this).stackName}-sync`,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.syncDeadLetterQueue,
      },
    });

    // Placeholder scheduled job: requeue connector sync heartbeat every 15 minutes
    const heartbeatFunction = new lambda.Function(this, 'HeartbeatFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return { statusCode: 200, body: JSON.stringify({ ok: true }) };
        };
      `),
      description: 'Placeholder connector sync heartbeat',
    });

    this.syncQueue.grantSendMessages(heartbeatFunction);

    const heartbeatRule = new events.Rule(this, 'HeartbeatRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      description: 'Trigger placeholder connector heartbeat',
    });

    heartbeatRule.addTarget(new eventsTargets.LambdaFunction(heartbeatFunction));

    // Lambda role policy to avoid overly permissive default
    if (heartbeatFunction.role) {
      new iam.Policy(this, 'HeartbeatSendPolicy', {
        roles: [heartbeatFunction.role],
        statements: [
          new iam.PolicyStatement({
            actions: ['sqs:SendMessage'],
            resources: [this.syncQueue.queueArn],
          }),
        ],
      });
    }
  }
}
