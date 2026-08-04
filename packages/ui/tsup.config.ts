import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // React is supplied by the host app (and by the design-system runtime), never bundled.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2022',
});
