import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface CdnProps {
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  /** Custom domain to alias on the distribution, e.g. "app.opsagenda.com". */
  readonly domainName?: string;
  /** ACM certificate ARN in us-east-1. Required when `domainName` is set. */
  readonly certificateArn?: string;
}

export class Cdn extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    // The Next.js app is built with `output: 'standalone'` and no
    // `assetPrefix`, so `.next/static` and `public/` are served directly by
    // the ECS-hosted server (see Dockerfile). All requests — including
    // `_next/static/*` — go to the ALB origin; there is no separate S3 asset
    // pipeline populating a CDN-only bucket.
    const albOrigin = new origins.HttpOrigin(props.loadBalancer.loadBalancerDnsName, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: albOrigin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
      },
      httpVersion: cloudfront.HttpVersion.HTTP3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      domainNames: props.domainName ? [props.domainName] : undefined,
      certificate:
        props.domainName && props.certificateArn
          ? acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn)
          : undefined,
    });
  }
}
