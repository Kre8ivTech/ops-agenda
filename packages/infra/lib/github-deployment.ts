import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface GitHubDeploymentProps {
  readonly githubRepository: string;
  readonly githubBranch: string;
  readonly oidcProviderArn?: string;
  readonly repository: ecr.IRepository;
  readonly cluster: ecs.ICluster;
  readonly service: ecs.Ec2Service;
  readonly taskDefinition: ecs.Ec2TaskDefinition;
}

/** Short-lived, branch-bound AWS access for the production deployment workflow. */
export class GitHubDeployment extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: GitHubDeploymentProps) {
    super(scope, id);

    const provider = props.oidcProviderArn
      ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          'GitHubProvider',
          props.oidcProviderArn,
        )
      : new iam.OpenIdConnectProvider(this, 'GitHubProvider', {
          url: 'https://token.actions.githubusercontent.com',
          clientIds: ['sts.amazonaws.com'],
        });

    const subject = `repo:${props.githubRepository}:ref:refs/heads/${props.githubBranch}`;

    this.role = new iam.Role(this, 'DeployRole', {
      roleName: `${cdk.Stack.of(this).stackName}-github-deploy`,
      description: `Deploy ${props.githubRepository} ${props.githubBranch} to ECS`,
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': subject,
        },
      }),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'GetEcrAuthorizationToken',
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    );

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'PushWebImage',
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:CompleteLayerUpload',
          'ecr:InitiateLayerUpload',
          'ecr:PutImage',
          'ecr:UploadLayerPart',
        ],
        resources: [props.repository.repositoryArn],
      }),
    );

    const taskDefinitionFamilyArn = cdk.Stack.of(this).formatArn({
      service: 'ecs',
      resource: 'task-definition',
      resourceName: `${props.taskDefinition.family}:*`,
    });

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadEcsService',
        actions: ['ecs:DescribeServices'],
        resources: [props.service.serviceArn],
      }),
    );

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'UpdateEcsService',
        actions: ['ecs:UpdateService'],
        resources: [props.service.serviceArn],
        conditions: {
          ArnLike: {
            'ecs:task-definition': taskDefinitionFamilyArn,
          },
        },
      }),
    );

    // DescribeTaskDefinition does not support resource-level permissions.
    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadTaskDefinition',
        actions: ['ecs:DescribeTaskDefinition'],
        resources: ['*'],
      }),
    );

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'RegisterTaskDefinitionRevision',
        actions: ['ecs:RegisterTaskDefinition'],
        resources: [taskDefinitionFamilyArn],
      }),
    );

    this.role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'PassExistingTaskRoles',
        actions: ['iam:PassRole'],
        resources: [
          props.taskDefinition.taskRole.roleArn,
          props.taskDefinition.obtainExecutionRole().roleArn,
        ],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'ecs-tasks.amazonaws.com',
          },
        },
      }),
    );
  }
}
