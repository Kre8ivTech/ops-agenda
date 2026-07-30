import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * NetworkStack — VPC for OpsAgenda.
 *
 * COST NOTE: natGateways = 0. A managed NAT Gateway costs ~$33/mo plus data
 * processing, which is the single biggest cost trap for a pre-revenue stack.
 * Instead we use PRIVATE_ISOLATED subnets (no internet egress) for the database
 * and in-VPC Lambdas, plus a free S3 Gateway endpoint. Interface endpoints are
 * added only where a service genuinely needs them (see `addInterfaceEndpoints`).
 *
 * SECURITY: the database lives in isolated subnets with no route to the
 * internet, so it is unreachable from outside the VPC regardless of SG rules.
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'OpsAgendaVpc', {
      maxAzs: 2, // RDS requires >= 2 AZs for a subnet group
      natGateways: 0,
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Free gateway endpoint — lets in-VPC compute reach S3 without NAT.
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }

  /**
   * Interface endpoints cost roughly $7/mo each, so they are opt-in.
   * Call this once Lambdas inside the VPC need SSM/KMS/Bedrock access.
   */
  public addInterfaceEndpoints(): void {
    this.vpc.addInterfaceEndpoint('SsmEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });
    this.vpc.addInterfaceEndpoint('KmsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
    });
  }
}
