#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack.js';
import { DataStack } from '../lib/data-stack.js';
import { JobsStack } from '../lib/jobs-stack.js';
import { NetworkStack } from '../lib/network-stack.js';

const app = new cdk.App();

// Region is fixed to us-east-1 (data residency + Bedrock model availability).
// Account comes from the ambient CLI credentials at deploy time.
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const network = new NetworkStack(app, 'OpsAgenda-Network', { env });

const data = new DataStack(app, 'OpsAgenda-Data', {
  env,
  vpc: network.vpc,
});

const auth = new AuthStack(app, 'OpsAgenda-Auth', { env });

const jobs = new JobsStack(app, 'OpsAgenda-Jobs', {
  env,
  key: data.key,
});

// Explicit ordering so CloudFormation deploys prerequisites first.
data.addDependency(network);
jobs.addDependency(data);

for (const stack of [network, data, auth, jobs]) {
  cdk.Tags.of(stack).add('Project', 'OpsAgenda');
  cdk.Tags.of(stack).add('Environment', 'dev');
  cdk.Tags.of(stack).add('ManagedBy', 'CDK');
}

app.synth();
