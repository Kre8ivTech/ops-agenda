import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface MarketingStackProps extends cdk.StackProps {
  /** Bare domain, e.g. "opsagenda.com". www.<domain> is added as an alias. */
  readonly domainName: string;
  /** ACM certificate ARN in us-east-1 covering domainName and www.domainName. */
  readonly certificateArn?: string;
  /** Path to the Next.js static export ("out/") to publish. */
  readonly siteSourcePath: string;
}

/**
 * Static marketing site (opsagenda.com) — S3 + CloudFront, no server. Kept as
 * its own stack because it has an independent lifecycle from the app/API
 * stack (OpsAgenda-<env>) and lives on the bare domain rather than a
 * per-environment subdomain.
 */
export class MarketingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MarketingStackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${props.domainName.replace(/\./g, '-')}-site`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const domainNames = props.certificateArn
      ? [props.domainName, `www.${props.domainName}`]
      : undefined;

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
      },
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 404, responsePagePath: '/404.html' },
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: '/404.html' },
      ],
      httpVersion: cloudfront.HttpVersion.HTTP3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      domainNames,
      certificate: props.certificateArn
        ? acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn)
        : undefined,
    });

    new s3deploy.BucketDeployment(this, 'Deployment', {
      sources: [s3deploy.Source.asset(props.siteSourcePath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain for the marketing site',
    });

    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: siteBucket.bucketName,
      description: 'S3 bucket serving the marketing site',
    });
  }
}
