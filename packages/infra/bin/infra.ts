#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { OpsAgendaStack } from '../lib/infra-stack.js';

const app = new cdk.App();

const envName = process.env.DEPLOYMENT_ENV ?? 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'us-east-1';

new OpsAgendaStack(app, `OpsAgenda-${envName}`, {
  env: {
    account,
    region,
  },
  envName,
  tags: {
    Project: 'OpsAgenda',
    Environment: envName,
  },
});
