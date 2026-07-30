import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class Storage extends Construct {
  public readonly auditBucket: s3.IBucket;
  public readonly assetBucket: s3.IBucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.auditBucket = new s3.Bucket(this, 'AuditBucket', {
      bucketName: `${cdk.Stack.of(this).stackName.toLowerCase()}-audit`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectLockEnabled: true,
      objectLockDefaultRetention: s3.ObjectLockRetention.compliance(cdk.Duration.days(2555)),
      lifecycleRules: [
        {
          transitions: [
            { storageClass: s3.StorageClass.GLACIER, transitionAfter: cdk.Duration.days(90) },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `${cdk.Stack.of(this).stackName.toLowerCase()}-assets`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
