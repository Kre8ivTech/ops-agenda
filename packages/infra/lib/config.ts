import * as cdk from 'aws-cdk-lib';

export interface OpsAgendaStackProps extends cdk.StackProps {
  readonly envName: string;
}

export const STACK_CONFIG = {
  vpc: {
    cidr: '10.0.0.0/16',
    maxAzs: 2,
  },
  rds: {
    instanceType: 't3.micro',
    engineVersion: '16.4',
    databaseName: 'opsagenda',
  },
  ecs: {
    instanceType: 't3.micro',
    desiredCapacity: 1,
    containerPort: 3000,
    cpu: 512,
    memory: 512, // t3.micro only has 1 GiB; keep container footprint small
  },
} as const;
