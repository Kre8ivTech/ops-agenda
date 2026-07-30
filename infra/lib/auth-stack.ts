import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

/**
 * AuthStack — Cognito user pool for OpsAgenda tenants.
 *
 * COST: Cognito is free up to 50k monthly active users, so this is $0 pre-revenue.
 *
 * SECURITY: MFA optional at MVP (enable REQUIRED before real customers),
 * strong password policy, email verification, and a `custom:tenant_id` claim
 * that the API maps to the Postgres session variable driving row-level security.
 *
 * MULTI-ACCOUNT: this pool is the *OpsAgenda* login. Linking a user's many
 * Microsoft/Google mailboxes happens per-connection in the app (tokens in the
 * vault) — NOT here — which is what removes the one-connector ceiling.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'OpsAgendaUserPool', {
      userPoolName: 'opsagenda-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: false, mutable: true },
      },
      customAttributes: {
        // Drives Postgres RLS tenant isolation.
        tenant_id: new cognito.StringAttribute({ mutable: true, minLen: 1, maxLen: 64 }),
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL, // set to REQUIRED before onboarding customers
      mfaSecondFactor: { sms: false, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      advancedSecurityMode: cognito.AdvancedSecurityMode.AUDIT,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: 'opsagenda-web',
      generateSecret: false, // public client (Next.js browser app)
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:3000/api/auth/callback/cognito'],
        logoutUrls: ['http://localhost:3000'],
      },
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
