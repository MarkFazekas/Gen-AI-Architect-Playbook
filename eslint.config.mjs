// @ts-check
// Shared lint rules for every TypeScript project in the workspace.
// Mirrors the Python baseline (ruff ALL, flake8 + wemake, mypy strict); see docs/quality-baseline.md.
import eslint from '@eslint/js';
import nx, { loadWorkspaceRules } from '@nx/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import rxjsX from 'eslint-plugin-rxjs-x';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Custom rules that cover wemake limits ESLint has no built-in rule for.
const workspaceRules = await loadWorkspaceRules('tools/lint-rules', 'tsconfig.base.json');

export default defineConfig([
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  globalIgnores(['**/dist', '**/out-tsc', '**/.angular', '**/coverage', '**/.nx', '**/node_modules', '**/test-output']),

  // mypy warn_unused_ignores
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },

  // ------------------------------------------------------------------ architecture
  {
    files: ['**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          banTransitiveDependencies: true,
          checkNestedExternalImports: true,
          allow: [String.raw`^.*/eslint(\.angular)?\.config\.[cm]?[jt]s$`],
          depConstraints: [
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'scope:playbook', onlyDependOnLibsWithTags: ['scope:playbook', 'scope:shared'] },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util'],
            },
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util'] },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
              bannedExternalImports: ['@angular/common/http', '@angular/router', 'zod'],
            },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'], bannedExternalImports: ['@angular/*'] },
          ],
        },
      ],
      // circular imports inside a project (cross-project cycles are caught by the Nx rule)
      'import-x/no-cycle': 'error',
    },
  },

  // ------------------------------------------------------------------ type safety and code quality
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      sonarjs.configs.recommended,
      unicorn.configs.recommended,
      jsdoc.configs['flat/recommended-typescript-error'],
      rxjsX.configs.strict,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ project: 'tsconfig.base.json' })],
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      workspace: { rules: workspaceRules },
    },
    rules: {
      // --- complexity and size limits (.flake8 / wemake values) ---
      complexity: ['error', 8], // max_complexity = 8
      'sonarjs/cognitive-complexity': ['error', 12], // wemake max-cognitive-score
      'max-params': ['error', 5], // wemake max-arguments
      'max-depth': ['error', 4], // wemake max-offset-blocks (approximation)
      'max-nested-callbacks': ['error', 3],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }], // max-module-members proxy
      'max-classes-per-file': ['error', 1],
      'id-length': ['error', { min: 2, max: 50, exceptions: ['_'] }], // max-name-length = 50
      'id-denylist': [
        'error',
        'data',
        'result',
        'results',
        'value',
        'values',
        'item',
        'items',
        'obj',
        'handle',
        'handler',
        'temp',
        'tmp',
        'foo',
        'bar',
        'baz',
        'info',
        'content',
      ], // WPS110
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }], // max-string-usages = 5
      'import-x/max-dependencies': ['error', { max: 15, ignoreTypeImports: true }], // max-imports = 15
      'workspace/max-methods': ['error', { max: 10 }], // max-methods = 10 (WPS214)

      // --- flake8-eradicate ---
      'sonarjs/no-commented-code': 'error',

      // --- flake8-print ---
      'no-console': 'error',

      // --- flake8-builtins ---
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow-restricted-names': 'error',
      'no-restricted-globals': ['error', 'event', 'name', 'status', 'length'],

      // --- flake8-annotations ---
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],

      // --- ruff TC ---
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',

      // --- ruff I (isort) ---
      'import-x/order': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // --- ruff dummy-variable-rgx ---
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // --- flake8-bugbear spirit ---
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      eqeqeq: ['error', 'always'],
      'no-param-reassign': 'error',
      'no-implicit-coercion': 'error',
      'prefer-template': 'error',

      // --- pep8-naming ---
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', modifiers: ['const', 'global'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'classProperty', modifiers: ['static', 'readonly'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: false } },
        { selector: 'enumMember', format: ['PascalCase'] },
        { selector: ['objectLiteralProperty', 'typeProperty'], format: null }, // API payload keys
        { selector: 'import', format: null },
      ],

      // --- pydocstyle (google) ---
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
        },
      ],
      'jsdoc/require-description': 'error',

      // --- unicorn: Angular compatibility ---
      'unicorn/no-null': 'off', // Angular forms and signals use null
      'unicorn/prevent-abbreviations': 'off', // covered by id-denylist + id-length
      'unicorn/prefer-top-level-await': 'off',
      // conflicts with the one-line docstring convention (pydocstyle D200)
      'unicorn/single-line-block-comment-style': 'off',
      // conflicts with jsdoc/check-alignment (circular autofix); JSDoc keeps its leading asterisks
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      // unresolved imports are compile errors already (tsc / typecheck target)
      'import-x/no-unresolved': 'off',
    },
  },

  // ------------------------------------------------------------------ unit tests (per-file-ignores)
  {
    files: ['**/*.spec.ts'],
    extends: [vitest.configs.recommended],
    rules: {
      // flake8-assertive
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/max-expects': ['error', { max: 5 }], // wemake max-asserts

      // .flake8 per-file-ignores: WPS201, WPS235
      'import-x/max-dependencies': 'off',
      'max-nested-callbacks': 'off',
      'max-lines': 'off',
      'sonarjs/no-duplicate-string': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },

  // ruff COM812: disable formatting rules that conflict with Prettier (always last)
  prettier,
]);
