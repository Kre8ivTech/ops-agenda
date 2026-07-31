import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export: deployed to S3 behind CloudFront at the bare opsagenda.com
  // domain. No server runtime — this site is content-only.
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true, // next/image's optimizer needs a server; not available in a static export
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
