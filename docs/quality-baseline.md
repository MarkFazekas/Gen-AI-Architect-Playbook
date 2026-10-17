# Quality baseline

This workspace carries over the quality baseline of a Python reference project (`ApplicantFilterSystemO/manager_backend`:
ruff `ALL`, flake8 + wemake-python-styleguide, mypy `strict`, gitlint) to Angular. This document explains the mapping
and the decisions. The configuration files themselves are the source of truth; they are listed in
[Where things live](#where-things-live).

## Layers

| Layer                    | Protects against                                                           | Python reference                | This workspace                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Type safety              | type errors, `any`, broken template bindings                               | mypy `strict` + pydantic plugin | strict `tsconfig`, Angular `strictTemplates`, type-aware ESLint                                                    |
| Code quality             | complexity, bug patterns, style, docs, spelling                            | ruff `ALL`, flake8, wemake      | ESLint (typescript-eslint, angular-eslint, sonarjs, unicorn, jsdoc, import-x, rxjs-x), Prettier, cspell, stylelint |
| Architecture             | layer violations, cycles, dead code                                        | none                            | Nx module boundaries (tags), `import-x/no-cycle`, knip                                                             |
| Runtime and user quality | untrusted API data, accessibility, critical flows, vulnerable dependencies | Pydantic, pytest                | Zod, Vitest, Playwright + axe, `npm audit`                                                                         |

Nx runs everything: tasks are cached, and CI checks only the projects a change affects (`nx affected`).

## Tool mapping

| Python                              | Here                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| mypy `strict`                       | `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, …)           |
| mypy pydantic plugin                | `angularCompilerOptions`: `strictTemplates`, `typeCheckHostBindings`, `extendedDiagnostics` as errors  |
| mypy `warn_unused_ignores`          | `linterOptions.reportUnusedDisableDirectives: "error"`                                                 |
| Pydantic (runtime validation)       | Zod schemas in `data-access` libraries                                                                 |
| ruff `ALL`                          | typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, angular-eslint `tsAll` + `templateAll` |
| ruff format                         | Prettier (`nx format:check`)                                                                           |
| ruff `I` / `TC`                     | `simple-import-sort`, `consistent-type-imports` (autofixed)                                            |
| ruff `dummy-variable-rgx`           | `no-unused-vars` with `^_` patterns                                                                    |
| mccabe `max-complexity = 8`         | `complexity: 8`                                                                                        |
| pydocstyle (google)                 | `eslint-plugin-jsdoc`                                                                                  |
| flake8-bugbear                      | strictTypeChecked (`no-floating-promises`, `switch-exhaustiveness-check`, …), sonarjs, rxjs-x          |
| flake8-print                        | `no-console`                                                                                           |
| flake8-eradicate                    | `sonarjs/no-commented-code`                                                                            |
| flake8-builtins                     | `@typescript-eslint/no-shadow`, `no-shadow-restricted-names`, `no-restricted-globals`                  |
| flake8-annotations                  | `explicit-function-return-type`, `explicit-module-boundary-types`, `explicit-member-accessibility`     |
| flake8-comprehensions               | unicorn, `@typescript-eslint/prefer-*`                                                                 |
| flake8-assertive                    | `@vitest/eslint-plugin` (`prefer-to-be`, `prefer-strict-equal`, …)                                     |
| flake8-spellcheck + `whitelist.txt` | cspell + `cspell.json` words                                                                           |
| pep8-naming                         | `@typescript-eslint/naming-convention`, angular-eslint selector rules                                  |
| gitlint                             | commitlint (`commit-msg` hook and CI)                                                                  |
| pytest / pytest-mock                | Vitest, `vi.fn()` / `vi.spyOn()`                                                                       |
| moto                                | `HttpTestingController`                                                                                |
| `.python-version`                   | `.nvmrc` + `engines`                                                                                   |

## `.flake8` limits

| Limit                              | Value | Rule                                                 | Status           |
| ---------------------------------- | ----- | ---------------------------------------------------- | ---------------- |
| `max_complexity`                   | 8     | `complexity`                                         | exact            |
| wemake cognitive score             | 12    | `sonarjs/cognitive-complexity`                       | exact            |
| `max_line_length`                  | 120   | Prettier `printWidth`                                | exact            |
| `max-string-usages` (WPS226)       | 5     | `sonarjs/no-duplicate-string`                        | exact            |
| `max-name-length` (WPS118)         | 50    | `id-length` (min 2, max 50)                          | exact            |
| wrong variable names (WPS110)      | –     | `id-denylist`                                        | exact            |
| `max-imports` (WPS201)             | 15    | `import-x/max-dependencies`                          | exact            |
| wemake `max-arguments`             | 5     | `max-params`                                         | exact            |
| wemake `max-asserts`               | 5     | `vitest/max-expects`                                 | exact            |
| `max-methods` (WPS214)             | 10    | `workspace/max-methods` (custom, `tools/lint-rules`) | exact            |
| wemake `max-offset-blocks`         | 5     | `max-depth: 4`                                       | approximate      |
| `max-module-members` (WPS202)      | 20    | `max-lines: 300`, `max-classes-per-file: 1`          | proxy            |
| `max-local-variables` (WPS210)     | 10    | custom rule, same pattern as `max-methods`           | to do            |
| `max-try-body-length` (WPS229)     | 2     | custom rule                                          | to do            |
| `max-import-from-members` (WPS235) | 15    | custom rule (`ImportDeclaration.specifiers.length`)  | to do            |
| `max-line-complexity` (WPS221)     | 13    | –                                                    | not carried over |

Python ignores and their counterparts: `E501` → Prettier owns line length; `N818` → no `Error` suffix enforced;
`WPS305` (f-strings) → template literals are required (`prefer-template`); `COM812` → `eslint-config-prettier` last;
test per-file ignores → the `**/*.spec.ts` block in `eslint.config.mjs`.

## Where things live

| File                                                           | Purpose                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `tsconfig.base.json`, `*/tsconfig.json`                        | strict TypeScript and Angular compiler options                       |
| `eslint.config.mjs`                                            | shared TypeScript rules, module boundaries, test rules               |
| `eslint.angular.mjs`                                           | Angular rules (`tsAll` / `templateAll` with a justified ignore list) |
| `*/eslint.config.mjs`                                          | per project: root + Angular config + Prettier                        |
| `tools/lint-rules/`                                            | custom ESLint rules (wemake gaps)                                    |
| `.prettierrc`, `.stylelintrc.json`, `cspell.json`, `knip.json` | formatting, SCSS lint, spelling, dead code                           |
| `commitlint.config.mjs`, `.husky/`                             | commit convention and git hooks                                      |
| `nx.json`                                                      | caching inputs, generator defaults, plugins, `neverConnectToCloud`   |
| `libs/shared/theme/`                                           | the single source of the visual identity                             |
| `.claude/`, `CLAUDE.md`, `.mcp.json`                           | AI agent rules, hooks and MCP servers                                |
| `.github/workflows/ci.yml`                                     | CI gate                                                              |

## Architecture

Every project has a `scope:*` and a `type:*` tag. `@nx/enforce-module-boundaries` enforces:

| Source             | May depend on                      | Banned external imports                          |
| ------------------ | ---------------------------------- | ------------------------------------------------ |
| `type:app`         | feature, ui, data-access, util     | –                                                |
| `type:feature`     | ui, data-access, util (no feature) | –                                                |
| `type:ui`          | ui, util                           | `@angular/common/http`, `@angular/router`, `zod` |
| `type:data-access` | data-access, util                  | –                                                |
| `type:util`        | util                               | `@angular/*`                                     |
| `scope:shared`     | `scope:shared` only                | –                                                |
| `scope:playbook`   | `scope:playbook`, `scope:shared`   | –                                                |

`banTransitiveDependencies` allows importing only packages declared in `package.json`.

## Naming

- Root package `@playbook/source`; library imports `@playbook/<lib>` (e.g. `@playbook/data-access`, `@playbook/shared-ui`).
- Project names `<scope>-<lib>`; selector prefix `pb`; kebab-case file names; no `Component` class suffix (Angular v20+ style guide).
- Commit messages `<type>: <Subject> - GAAP-<number>` (`GAAP-0` without a ticket), enforced by commitlint.

## Styles and theme

- SCSS (Sass module system; `@import` is banned) with Angular Material 3.
- Components have separate `.ts`, `.html` and `.scss` files: `component-max-inline-declarations` is set to 0, and
  `template/no-inline-styles` bans `style` attributes and style bindings.
- The visual identity is configured in one place, `libs/shared/theme/src/theme.scss`. Palettes are generated, never
  hand-edited (the command is at the top of that file).
- Components use tokens only (`--mat-sys-*`, `--pb-*`). stylelint enforces this to avoid a generic, "AI-generated"
  look:

| Rule                                                                    | Enforced by                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| No raw colors (`#hex`, `rgb()`, `oklch()`, …) outside the theme library | `color-no-hex`, `function-disallowed-list`, `declaration-strict-value` |
| No gradients                                                            | `function-disallowed-list`                                             |
| Shadows, corners, fonts and z-index from tokens only                    | `declaration-strict-value`                                             |
| No `::ng-deep`, `!important` or ID selectors                            | stylelint                                                              |
| Theme changes need human approval                                       | Claude Code `guard-edit` hook                                          |
| Material components first, restrained color use, no emoji icons         | review rule (`CLAUDE.md`)                                              |

## Gates

| Stage           | Runs                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| AI agent edit   | Claude Code hooks: guards before the edit; Prettier, ESLint, stylelint, cspell on the file after it                |
| AI agent finish | Stop hook: `nx affected -t lint typecheck test` for the changed files                                              |
| `pre-commit`    | lint-staged: ESLint, Prettier, stylelint, cspell on staged files                                                   |
| `commit-msg`    | commitlint                                                                                                         |
| `pre-push`      | `nx sync:check`, `nx affected -t lint typecheck test`                                                              |
| CI              | sync and format checks, `nx affected -t lint typecheck test build e2e`, stylelint, cspell, knip, audit, commitlint |

`npm run quality` runs the whole gate locally (without e2e).

## AI tooling

- `CLAUDE.md`: project rules for agents (the Nx block is maintained by `nx configure-ai-agents`).
- Nx Claude Code plugin (skills + Nx MCP), enabled in `.claude/settings.json`.
- MCP servers in `.mcp.json`: Angular CLI (read-only: best practices, docs) and Playwright (browser checks).
- Hooks in `.claude/hooks/`, started through `run.sh`, which selects the Node version from `.nvmrc`:
  - `guard-edit.mjs`: quality-gate and theme files need approval; no new `eslint-disable`, `@ts-ignore` or `.only` in code.
  - `guard-bash.mjs`: no skipped git hooks, force push, Nx Cloud or publishing; dependency updates and shell writes
    to protected files need approval.
  - `lint-file.mjs`: formats, autofixes and reports the remaining problems after each edit.
  - `quality-gate.mjs`: runs lint, typecheck and tests on affected projects before the agent finishes.
- Skill `/new-lib`: creates a library with the naming convention and tags.

## Decisions

| Topic            | Decision                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Monorepo tooling | Nx 23, without Nx Cloud (`neverConnectToCloud`)                                          |
| Node             | 26 (LTS from 2026-10-28, supported until 2029-04-30), nvm + `.nvmrc`                     |
| Package manager  | npm, lockfile committed, `save-exact`, `engine-strict`                                   |
| Framework        | Angular 22.2 (22.1 had high/critical advisories), zoneless, standalone, signals          |
| UI               | Angular Material 3, central theme, IBM Plex Sans/Serif and Material Symbols, self-hosted |
| Unit tests       | Vitest: `vitest-angular` for the app, `vitest-analog` for libraries                      |
| End-to-end       | Playwright (Chromium) + axe WCAG 2.1 AA                                                  |
| Language         | English for code, docs and commit messages                                               |

## Deviations found during setup

- `vitest-angular` needs buildable libraries, so the (non-buildable) libraries use `vitest-analog`.
- The Playwright Atomizer (`e2e-ci`) only runs with Nx Cloud, so CI uses the plain `e2e` target.
- Custom ESLint rules live in `tools/lint-rules`, not `tools/eslint-rules`: `@nx/eslint-plugin` auto-loads the latter as
  a legacy location. Rules are `.mjs` so they load without a TypeScript transpiler.
- ESLint 10 is used; the config is looked up from each linted file, so lint-staged and the hooks pick up the project configs.
- Disabled on purpose: `unicorn/single-line-block-comment-style` (conflicts with one-line docstrings),
  `unicorn/no-asterisk-prefix-in-documentation-comments` (circular autofix with `jsdoc/check-alignment`),
  `import-x/no-unresolved` (TypeScript reports unresolved imports already).
- `npm run audit` fails on high advisories in production dependencies and on critical ones anywhere. Some development
  tools (stylelint via `braces`, Nx via `undici`) have high advisories without a fix yet.
- Template type checks run in the Angular compiler only, so `build` is part of the type-safety gate next to `typecheck`.
- Hooks (Claude Code and git) select the Node version from `.nvmrc` because the shell default may be older.

## Open items

- Custom rules for WPS210, WPS229, WPS235 and WPS202 (same pattern as `tools/lint-rules/rules/max-methods.mjs`).
- Coverage thresholds (`coverage.thresholds` in each `vite.config.mts`).
- Final brand colors and fonts (regenerate the palettes; two lines in `theme.scss`).
- The lazy feature chunk is ~465 kB raw, mostly Zod; consider `zod/mini` once the data layer grows.
