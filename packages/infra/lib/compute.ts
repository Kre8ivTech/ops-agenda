import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface ComputeProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly ecsSecurityGroup: ec2.ISecurityGroup;
  readonly instanceType: string;
  readonly desiredCapacity: number;
  readonly containerPort: number;
  readonly cpu: number;
  readonly memory: number;

  readonly repository: ecr.IRepository;
  readonly imageTag: string;
  readonly appUrl: string;
  readonly awsRegion: string;

  readonly databaseSecret: secretsmanager.ISecret;
  readonly databaseHost: string;
  readonly databasePort: string;
  readonly databaseName: string;

  readonly userPool: cognito.IUserPool;
  readonly cognitoUserPoolId: string;
  readonly cognitoClientId: string;
  readonly cognitoDomain: string;

  readonly auditBucket: s3.IBucket;
  readonly syncQueue: sqs.IQueue;
  readonly signupAccessCodes?: string;
}

export class Compute extends Construct {
  public readonly cluster: ecs.ICluster;
  public readonly service: ecs.Ec2Service;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: `${cdk.Stack.of(this).stackName}-cluster`,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });
    this.cluster = cluster;

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf install -y amazon-cloudwatch-agent',
      'echo ECS_CLUSTER=' + cluster.clusterName + ' >> /etc/ecs/ecs.config',
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: new ec2.InstanceType(props.instanceType),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2023(),
      userData,
      securityGroup: props.ecsSecurityGroup,
      requireImdsv2: true,
      role: new iam.Role(this, 'InstanceRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonEC2ContainerServiceforEC2Role',
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
          // SSM Session Manager: lets an operator port-forward to RDS (which has
          // no public endpoint) through this instance for one-off migrations,
          // without opening SSH or giving RDS a public IP.
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        ],
      }),
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'Asg', {
      vpc: props.vpc,
      launchTemplate,
      minCapacity: props.desiredCapacity,
      maxCapacity: 2,
      desiredCapacity: props.desiredCapacity,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'CapacityProvider', {
      autoScalingGroup,
      enableManagedScaling: false,
      enableManagedTerminationProtection: false,
    });

    cluster.addAsgCapacityProvider(capacityProvider);

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Unauthenticated-flow Cognito APIs (SignUp/ConfirmSignUp/ForgotPassword/
    // ConfirmForgotPassword) still require IAM permission when called from the
    // server-side AWS SDK, scoped to this user pool only.
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:SignUp',
          'cognito-idp:ConfirmSignUp',
          'cognito-idp:ForgotPassword',
          'cognito-idp:ConfirmForgotPassword',
        ],
        resources: [props.userPool.userPoolArn],
      }),
    );

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef', {
      networkMode: ecs.NetworkMode.BRIDGE,
      taskRole,
    });

    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/ecs/${cdk.Stack.of(this).stackName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sessionSecret = new secretsmanager.Secret(this, 'SessionSecret', {
      description: 'iron-webcrypto session-sealing key for the web app',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 48,
      },
    });

    const container = taskDefinition.addContainer('nextjs', {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, props.imageTag),
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'nextjs',
        logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: props.containerPort.toString(),
        AWS_REGION: props.awsRegion,
        // Server-only origin used for Cognito redirect_uri (runtime-safe).
        APP_URL: props.appUrl,
        NEXT_PUBLIC_APP_URL: props.appUrl,
        DB_HOST: props.databaseHost,
        DB_PORT: props.databasePort,
        DB_NAME: props.databaseName,
        COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
        COGNITO_CLIENT_ID: props.cognitoClientId,
        COGNITO_DOMAIN: props.cognitoDomain,
        AUDIT_BUCKET_NAME: props.auditBucket.bucketName,
        SYNC_QUEUE_URL: props.syncQueue.queueUrl,
        ...(props.signupAccessCodes ? { SIGNUP_ACCESS_CODES: props.signupAccessCodes } : {}),
      },
      secrets: {
        DB_USER: ecs.Secret.fromSecretsManager(props.databaseSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.databaseSecret, 'password'),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(sessionSecret),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          `node -e 'require("http").get("http://localhost:${props.containerPort}/api/health", r => process.exit(r.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1))'`,
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: props.containerPort,
      hostPort: props.containerPort, // fixed host port so the ALB security group can allow it
      protocol: ecs.Protocol.TCP,
    });

    this.service = new ecs.Ec2Service(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true,
      capacityProviderStrategies: [
        { capacityProvider: capacityProvider.capacityProviderName, weight: 1, base: 1 },
      ],
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    this.listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: false,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: props.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        this.service.loadBalancerTarget({
          containerName: 'nextjs',
          containerPort: props.containerPort,
        }),
      ],
      healthCheck: {
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    this.listener.addTargetGroups('Default', {
      targetGroups: [targetGroup],
    });
  }
}
