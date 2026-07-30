import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // A committed .only would silently shrink the suite in CI.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `next start` is incompatible with `output: "standalone"`. Serve the
    // standalone bundle the same way ECS will.
    command:
      'pnpm build && mkdir -p .next/standalone/packages/web/public .next/standalone/packages/web/.next && cp -R public/. .next/standalone/packages/web/public/ && cp -R .next/static .next/standalone/packages/web/.next/static && PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/packages/web/server.js',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
