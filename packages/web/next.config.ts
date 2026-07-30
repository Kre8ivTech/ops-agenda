import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for the ECS container image: emits a self-contained server bundle
  // with a minimal node_modules, so the runtime image does not need pnpm or the
  // full workspace. See TECHSTACK.md (AWS decision, 2026-07-29).
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    // Typecheck is its own CI job, but never let a broken build through.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
