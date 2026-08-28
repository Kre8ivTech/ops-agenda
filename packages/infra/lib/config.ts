import * as cdk from 'aws-cdk-lib';

export interface OpsAgendaStackProps extends cdk.StackProps {
  readonly envName: string;
  /** Custom domain for the CloudFront distribution, e.g. "app.opsagenda.com". */
  readonly domainName?: string;
  /** ACM certificate ARN in us-east-1 for `domainName` (required by CloudFront). */
  readonly certificateArn?: string;
  /** Tag of the web app image already pushed to the ECR repository. */
  readonly imageTag?: string;
  /** Comma-separated self-serve signup access codes (see SIGNUP_ACCESS_CODES). */
  readonly signupAccessCodes?: string;
  /** GitHub owner/repository allowed to deploy the web service through OIDC. */
  readonly githubRepository: string;
  /** Git branch allowed to deploy the web service through OIDC. */
  readonly githubDeployBranch: string;
  /** Import an account-level GitHub OIDC provider instead of creating one. */
  readonly githubOidcProviderArn?: string;
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
