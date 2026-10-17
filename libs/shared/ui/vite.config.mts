/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/ui',
  plugins: [angular(), tsconfigPaths()],
  test: {
    name: 'shared-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/test-setup.ts', 'src/index.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      reportsDirectory: '../../../coverage/libs/shared/ui',
      provider: 'v8' as const,
    },
  },
}));
