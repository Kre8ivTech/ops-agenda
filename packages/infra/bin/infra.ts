#!/usr/bin/env node
import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { OpsAgendaStack } from '../lib/infra-stack.js';
import { MarketingStack } from '../lib/marketing-stack.js';
import { WaitlistStack } from '../lib/waitlist-stack.js';

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
  githubRepository: process.env.GITHUB_REPOSITORY ?? 'Kre8ivTech/ops-agenda',
  githubDeployBranch: process.env.GITHUB_DEPLOY_BRANCH ?? 'main',
  githubOidcProviderArn: process.env.GITHUB_OIDC_PROVIDER_ARN,
  tags: {
    Project: 'OpsAgenda',
    Environment: envName,
  },
});

// Bare-domain marketing site — independent lifecycle from the app stack
// above, only deployed once MARKETING_DOMAIN_NAME is set.
if (process.env.MARKETING_DOMAIN_NAME) {
  new MarketingStack(app, 'OpsAgendaMarketing', {
    env: { account, region: 'us-east-1' }, // CloudFront certs must be us-east-1
    domainName: process.env.MARKETING_DOMAIN_NAME,
    certificateArn: process.env.MARKETING_CERTIFICATE_ARN,
    siteSourcePath: path.resolve(process.cwd(), '../marketing/out'),
    tags: {
      Project: 'OpsAgenda',
      Environment: 'marketing',
    },
  });
}

// Waitlist signup backend — independent lifecycle, always deployed (no
// domain dependency; the marketing site consumes its Function URL directly).
const marketingDomain = process.env.MARKETING_DOMAIN_NAME;
new WaitlistStack(app, 'OpsAgendaWaitlist', {
  env: { account, region },
  allowedOrigins: [
    ...(marketingDomain ? [`https://${marketingDomain}`, `https://www.${marketingDomain}`] : []),
    'http://localhost:3000',
  ],
  tags: {
    Project: 'OpsAgenda',
    Environment: 'marketing',
  },
});
