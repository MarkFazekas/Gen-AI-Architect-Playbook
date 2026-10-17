// @ts-check
import prettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';

import angularConfig from '../../eslint.angular.mjs';
import baseConfig from '../../eslint.config.mjs';

export default defineConfig([...baseConfig, ...angularConfig, prettier]);
