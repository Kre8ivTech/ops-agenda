import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// This machine sets NODE_ENV=production globally via `launchctl setenv`, and every
// GUI-launched process inherits it. Under that value Vite resolves React's
// PRODUCTION build, in which `act` does not exist, so every React Testing Library
// render dies with "React.act is not a function".
//
// Object.assign rather than a direct write: @types/node marks NODE_ENV readonly.
// Pinning it here keeps the suite identical on this machine, a clean laptop, and
// CI, instead of depending on ambient shell state.
Object.assign(process.env, { NODE_ENV: 'test' });

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Playwright owns e2e/; Vitest must not try to run those.
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',
        'src/lib/env.ts',
      ],
      thresholds: {
        // Ratchet from the measured August 2026 baseline. Raise these as
        // coverage grows; lowering them should require an explicit review.
        statements: 5,
        branches: 45,
        functions: 20,
        lines: 5,
      },
    },
  },
});
