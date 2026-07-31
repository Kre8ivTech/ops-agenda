import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class Repository extends Construct {
  public readonly repository: ecr.IRepository;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.repository = new ecr.Repository(this, 'AppRepo', {
      repositoryName: `${cdk.Stack.of(this).stackName.toLowerCase()}-web`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      lifecycleRules: [
        {
          description: 'Keep the last 10 images',
          maxImageCount: 10,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
  }
}
