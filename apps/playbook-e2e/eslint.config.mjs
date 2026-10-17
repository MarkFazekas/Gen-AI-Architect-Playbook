// @ts-check
import prettier from 'eslint-config-prettier/flat';
import playwright from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';

import baseConfig from '../../eslint.config.mjs';

export default defineConfig([
  ...baseConfig,
  { files: ['**/*.ts'], extends: [playwright.configs['flat/recommended']] },
  prettier,
]);
