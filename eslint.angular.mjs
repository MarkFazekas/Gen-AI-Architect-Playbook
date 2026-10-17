// @ts-check
// Shared Angular rules for every Angular project (apps and libs).
// flat/angular = angular-eslint tsRecommended + inline template processor,
// flat/angular-template = templateRecommended + templateAccessibility.
// On top of those: tsAll / templateAll (the "ruff ALL" equivalent) with a justified ignore list.
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsAll],
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'pb', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'pb', style: 'camelCase' }],
      // every template and stylesheet lives in its own file
      '@angular-eslint/component-max-inline-declarations': ['error', { template: 0, styles: 0, animations: 0 }],
      // Angular v20+ style guide: no "Component" / "Directive" class suffix
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      // only relevant with @angular/localize
      '@angular-eslint/require-localize-metadata': 'off',
      '@angular-eslint/runtime-localize': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateAll],
    rules: {
      '@angular-eslint/template/cyclomatic-complexity': ['error', { maxComplexity: 8 }],
      // only relevant with @angular/localize
      '@angular-eslint/template/i18n': 'off',
      // calling signals in templates is the intended pattern
      '@angular-eslint/template/no-call-expression': 'off',
    },
  },
]);
