# Gen-AI-Architect-Playbook

Angular 22 + Nx 23 monorepo with a strict quality baseline (type safety, lint, architecture, accessibility) and
Claude Code integration.

## Prerequisites

- Node.js 26 (see `.nvmrc`): `nvm install && nvm use`
- `npm ci`
- For end-to-end tests: `npx playwright install chromium`

## Workspace

| Project                     | Path                             | Tags                                 |
| --------------------------- | -------------------------------- | ------------------------------------ |
| `playbook`                  | `apps/playbook`                  | `scope:playbook`, `type:app`         |
| `playbook-e2e`              | `apps/playbook-e2e`              | `scope:playbook`, `type:e2e`         |
| `playbook-feature-patterns` | `libs/playbook/feature-patterns` | `scope:playbook`, `type:feature`     |
| `playbook-data-access`      | `libs/playbook/data-access`      | `scope:playbook`, `type:data-access` |
| `shared-ui`                 | `libs/shared/ui`                 | `scope:shared`, `type:ui`            |
| `shared-util`               | `libs/shared/util`               | `scope:shared`, `type:util`          |
| `shared-theme`              | `libs/shared/theme`              | `scope:shared`, `type:theme`         |

## Commands

| Command                                  | What it does                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `npx nx serve playbook`                  | Dev server on http://localhost:4200                                                     |
| `npm run quality`                        | Full gate: sync, format, lint, typecheck, test, build, stylelint, spelling, knip, audit |
| `npx nx affected -t lint typecheck test` | Only the projects touched by your change                                                |
| `npx nx e2e playbook-e2e`                | Playwright end-to-end tests including an axe WCAG 2.1 AA scan                           |

## Conventions

- Commit messages: `<type>: <Subject> - GAAP-<number>` (enforced by commitlint).
- The visual identity lives in `libs/shared/theme`; components use design tokens only.
- `CLAUDE.md` lists the rules that also apply to AI agents.
- `docs/quality-baseline.md` explains the quality baseline and the decisions behind it.
