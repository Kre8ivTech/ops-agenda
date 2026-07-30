import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthProps {
  readonly callbackUrls: string[];
  readonly logoutUrls: string[];
}

export class Auth extends Construct {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly domain: cognito.IUserPoolDomain;
  public readonly cognitoDomain: string;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${cdk.Stack.of(this).stackName}-users`,
      selfSignUpEnabled: false, // admin/onboarding creates accounts
      signInAliases: { email: true },
      autoVerify: { email: true },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'WebClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: false,
        userSrp: false,
        custom: true, // server-side auth code exchange
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
      },
      preventUserExistenceErrors: true,
    });

    this.domain = new cognito.UserPoolDomain(this, 'Domain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `opsagenda-${cdk.Stack.of(this)
          .stackName.toLowerCase()
          .replace(/[^a-z0-9-]/g, '')}`,
      },
    });

    this.cognitoDomain = `${this.domain.domainName}.auth.${cdk.Stack.of(this).region}.amazoncognito.com`;
  }
}
