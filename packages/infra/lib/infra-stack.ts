import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Auth } from './auth.js';
import { Cdn } from './cdn.js';
import { Compute } from './compute.js';
import { Database } from './database.js';
import { Networking } from './networking.js';
import { Queue } from './queue.js';
import { Repository } from './repository.js';
import { Storage } from './storage.js';
import { OpsAgendaStackProps, STACK_CONFIG } from './config.js';

export class OpsAgendaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OpsAgendaStackProps) {
    super(scope, id, props);

    const appUrl = props.domainName
      ? `https://${props.domainName}`
      : `https://${props.envName}.opsagenda.example.com`; // placeholder until a domain is assigned

    const networking = new Networking(this, 'Networking', {
      cidr: STACK_CONFIG.vpc.cidr,
      maxAzs: STACK_CONFIG.vpc.maxAzs,
      containerPort: STACK_CONFIG.ecs.containerPort,
    });

    const repository = new Repository(this, 'Repository');

    const database = new Database(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.rdsSecurityGroup,
      instanceType: STACK_CONFIG.rds.instanceType,
      engineVersion: STACK_CONFIG.rds.engineVersion,
      databaseName: STACK_CONFIG.rds.databaseName,
    });

    const auth = new Auth(this, 'Auth', {
      callbackUrls: [`${appUrl}/api/auth/callback`],
      logoutUrls: [appUrl],
    });

    const storage = new Storage(this, 'Storage');
    const queue = new Queue(this, 'Queue');

    const compute = new Compute(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      ecsSecurityGroup: networking.ecsSecurityGroup,
      instanceType: STACK_CONFIG.ecs.instanceType,
      desiredCapacity: STACK_CONFIG.ecs.desiredCapacity,
      containerPort: STACK_CONFIG.ecs.containerPort,
      cpu: STACK_CONFIG.ecs.cpu,
      memory: STACK_CONFIG.ecs.memory,
      repository: repository.repository,
      imageTag: props.imageTag ?? 'latest',
      appUrl,
      awsRegion: this.region,
      databaseSecret: database.secret,
      databaseHost: database.instance.dbInstanceEndpointAddress,
      databasePort: database.instance.dbInstanceEndpointPort,
      databaseName: database.databaseName,
      userPool: auth.userPool,
      cognitoUserPoolId: auth.userPool.userPoolId,
      cognitoClientId: auth.userPoolClient.userPoolClientId,
      cognitoDomain: auth.cognitoDomain,
      auditBucket: storage.auditBucket,
      syncQueue: queue.syncQueue,
      signupAccessCodes: props.signupAccessCodes,
    });

    const cdn = new Cdn(this, 'Cdn', {
      loadBalancer: compute.loadBalancer,
      domainName: props.domainName,
      certificateArn: props.certificateArn,
    });

    // SSM parameters for the application to read at runtime
    const ssmPrefix = `/opsagenda/${props.envName}`;

    new ssm.StringParameter(this, 'SsmAppUrl', {
      parameterName: `${ssmPrefix}/app-url`,
      stringValue: appUrl,
    });

    new ssm.StringParameter(this, 'SsmDatabaseHost', {
      parameterName: `${ssmPrefix}/database-host`,
      stringValue: database.instance.dbInstanceEndpointAddress,
    });

    new ssm.StringParameter(this, 'SsmDatabasePort', {
      parameterName: `${ssmPrefix}/database-port`,
      stringValue: database.instance.dbInstanceEndpointPort,
    });

    new ssm.StringParameter(this, 'SsmDatabaseName', {
      parameterName: `${ssmPrefix}/database-name`,
      stringValue: database.databaseName,
    });

    new ssm.StringParameter(this, 'SsmDatabaseSecretArn', {
      parameterName: `${ssmPrefix}/database-secret-arn`,
      stringValue: database.secret.secretArn,
    });

    new ssm.StringParameter(this, 'SsmCognitoUserPoolId', {
      parameterName: `${ssmPrefix}/cognito/user-pool-id`,
      stringValue: auth.userPool.userPoolId,
    });

    new ssm.StringParameter(this, 'SsmCognitoClientId', {
      parameterName: `${ssmPrefix}/cognito/client-id`,
      stringValue: auth.userPoolClient.userPoolClientId,
    });

    new ssm.StringParameter(this, 'SsmCognitoDomain', {
      parameterName: `${ssmPrefix}/cognito/domain`,
      stringValue: auth.cognitoDomain,
    });

    new ssm.StringParameter(this, 'SsmAuditBucket', {
      parameterName: `${ssmPrefix}/audit-bucket`,
      stringValue: storage.auditBucket.bucketName,
    });

    new ssm.StringParameter(this, 'SsmSyncQueueUrl', {
      parameterName: `${ssmPrefix}/sync-queue-url`,
      stringValue: queue.syncQueue.queueUrl,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: cdn.distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: compute.loadBalancer.loadBalancerDnsName,
      description: 'ALB DNS name',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: database.instance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: auth.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: auth.cognitoDomain,
      description: 'Cognito hosted UI domain',
    });

    new cdk.CfnOutput(this, 'SyncQueueUrl', {
      value: queue.syncQueue.queueUrl,
      description: 'Connector sync SQS queue URL',
    });

    new cdk.CfnOutput(this, 'AuditBucketName', {
      value: storage.auditBucket.bucketName,
      description: 'Immutable audit log bucket',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repository.repositoryUri,
      description: 'ECR repository for the web app image',
    });
  }
}
