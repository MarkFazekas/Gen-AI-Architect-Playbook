<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Gen-AI-Architect-Playbook

Angular 22 + Nx 23 monorepo. The repository language is English (code, comments, docs, commit messages).
The quality baseline and its rationale: `docs/quality-baseline.md`.

## Commands

- Run everything through Nx (cache + affected): `npx nx affected -t lint typecheck test`, `npx nx run <project>:<target>`.
- Full local gate: `npm run quality`. End-to-end and accessibility: `npx nx e2e playbook-e2e`.
- Create libraries only with the `/new-lib` skill (naming convention and tags are mandatory).

## Rules

- Never disable or relax a lint, type or test rule (`eslint-disable`, `@ts-ignore`, `.only`, config changes). If a rule looks wrong, ask.
- Module boundaries: `feature` → `ui` / `data-access` / `util`; `ui` uses no HttpClient, router or Zod; backend data is Zod-validated in a `data-access` library.
- Names: imports `@playbook/<lib>`, selector prefix `pb`, kebab-case file names, no `Component` class suffix.
- Every component has separate `.ts`, `.html` and (if needed) `.scss` files, OnPush change detection and signal inputs.
- Commit messages: `<type>: <Subject> - GAAP-<number>` (e.g. `feat: Add pattern list - GAAP-12`; `GAAP-0` without a ticket).
  No AI co-author trailers (`Co-Authored-By: Claude …`) in commit messages.
- No Nx Cloud; never skip git hooks.

## Design (Angular Material 3)

- Colors, typography, corners and shadows come from tokens only: `--mat-sys-*` and `--pb-*`. The single source of the theme is `libs/shared/theme/`; do not change it unless asked.
- Material components first; build a custom one only when Material has no fit.
- Restrained color use: neutral surfaces (`surface*`), `primary` only for main actions, `tertiary` rarely.
- No gradients, glows, decorative shadows, emoji icons (use Material Symbols) or "hero" decoration nobody asked for.
- Check finished UI with the Playwright MCP in light and dark mode before reporting it done.

## Hooks

- After each edit a hook formats, autofixes and returns the remaining lint and spelling problems: fix them right away.
- Before finishing, the Stop hook runs lint, typecheck and unit tests on the affected projects.
- If you changed quality-gate or theme configuration (lint, TypeScript, test, coverage, hooks, CI, theme), list those
  files with what changed and why under a "Quality-gate changes" heading in your final message.
