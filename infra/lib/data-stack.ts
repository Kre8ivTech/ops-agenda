import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

/**
 * DataStack — encrypted Postgres + KMS key + S3 bucket.
 *
 * COST: db.t3.micro is AWS free-tier eligible for 12 months (750 hrs/mo,
 * 20 GB storage). Single-AZ and 7-day backups keep it cheap pre-revenue.
 * Upgrade path: Aurora Serverless v2 + Multi-AZ when tenant load justifies it.
 *
 * SECURITY: storage encrypted with a customer-managed KMS key; instance sits in
 * PRIVATE_ISOLATED subnets (no internet route); credentials auto-generated and
 * stored in Secrets Manager (the DB master secret is the one secret worth the
 * cost — application/tenant tokens go in SSM Parameter Store instead).
 * Tenant isolation is enforced at the application layer via Postgres RLS.
 */
export class DataStack extends cdk.Stack {
  public readonly key: kms.Key;
  public readonly database: rds.DatabaseInstance;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // One customer-managed key for the MVP. Per-tenant envelope encryption uses
    // data keys generated under this CMK; per-tenant CMKs come at scale.
    this.key = new kms.Key(this, 'OpsAgendaKey', {
      alias: 'alias/opsagenda',
      enableKeyRotation: true,
      description: 'OpsAgenda encryption key (DB, S3, tenant token envelopes)',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.bucket = new s3.Bucket(this, 'OpsAgendaBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc,
      description: 'OpsAgenda Postgres — no inbound by default',
      allowAllOutbound: false,
    });

    this.database = new rds.DatabaseInstance(this, 'OpsAgendaDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      // Free-tier eligible instance class for the first 12 months.
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      allocatedStorage: 20, // free-tier limit
      maxAllocatedStorage: 100, // autoscale ceiling
      storageEncrypted: true,
      storageEncryptionKey: this.key,
      multiAz: false, // cost: enable before production customers
      publiclyAccessible: false,
      databaseName: 'opsagenda',
      credentials: rds.Credentials.fromGeneratedSecret('opsagenda_admin', {
        encryptionKey: this.key,
      }),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.database.secret?.secretArn ?? 'none',
    });
    new cdk.CfnOutput(this, 'KmsKeyArn', { value: this.key.keyArn });
    new cdk.CfnOutput(this, 'BucketName', { value: this.bucket.bucketName });
  }
}
