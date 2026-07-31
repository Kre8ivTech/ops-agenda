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
  // Custom domain is optional — omit both to fall back to the CloudFront
  // default domain and a placeholder appUrl (used for Cognito callbacks).
  domainName: process.env.APP_DOMAIN_NAME,
  certificateArn: process.env.APP_CERTIFICATE_ARN,
  imageTag: process.env.APP_IMAGE_TAG,
  signupAccessCodes: process.env.SIGNUP_ACCESS_CODES,
  tags: {
    Project: 'OpsAgenda',
    Environment: envName,
  },
});
