import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface DatabaseProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly instanceType: string;
  readonly engineVersion: string;
  readonly databaseName: string;
}

export class Database extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly databaseName: string;
  public readonly secret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    this.secret = new rds.DatabaseSecret(this, 'MasterSecret', {
      username: 'opsagenda_admin',
      secretName: `${cdk.Stack.of(this).stackName}/rds/master`,
    });

    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      parameters: {
        'rds.force_ssl': '1',
        log_connections: '1',
        log_disconnections: '1',
        log_checkpoints: '1',
      },
    });

    this.instance = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: new ec2.InstanceType(props.instanceType),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.secret),
      databaseName: props.databaseName,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      deletionProtection: false, // enable in production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // adjust for production
      backupRetention: cdk.Duration.days(7),
      cloudwatchLogsExports: ['postgresql'],
      parameterGroup,
    });

    this.databaseName = props.databaseName;

    // IAM auth role for application (optional; app can also use master secret via SSM)
    const dbAccessRole = new iam.Role(this, 'AppDbAccessRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    this.instance.grantConnect(dbAccessRole);
  }
}
