import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'echo ECS_CLUSTER=' + cluster.clusterName + ' >> /etc/ecs/ecs.config',
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: new ec2.InstanceType(props.instanceType),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
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

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef', {
      networkMode: ecs.NetworkMode.BRIDGE,
    });

    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/ecs/${cdk.Stack.of(this).stackName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Placeholder on port 80 so the ALB/target group health checks pass in dev
    // before the real Next.js container image is deployed. The real app will
    // restore port 3000 and the /api/health endpoint.
    const placeholderPort = 80;
    const container = taskDefinition.addContainer('nextjs', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:22-alpine'),
      memoryLimitMiB: props.memory,
      cpu: props.cpu,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'nextjs',
        logGroup,
      }),
      environment: {
        PORT: placeholderPort.toString(),
        NODE_ENV: 'production',
      },
      command: [
        'sh',
        '-c',
        `node -e 'require("http").createServer((_,res)=>res.end("ok")).listen(${placeholderPort})'`,
      ],
      healthCheck: {
        command: [
          'CMD-SHELL',
          `node -e 'require("http").get("http://localhost:${placeholderPort}/", r => process.exit(r.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1))'`,
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: placeholderPort,
      hostPort: placeholderPort, // fixed host port so the ALB security group can allow it
      protocol: ecs.Protocol.TCP,
    });

    this.service = new ecs.Ec2Service(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      circuitBreaker: { rollback: true },
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
      port: placeholderPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        this.service.loadBalancerTarget({
          containerName: 'nextjs',
          containerPort: placeholderPort,
        }),
      ],
      healthCheck: {
        path: '/',
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
