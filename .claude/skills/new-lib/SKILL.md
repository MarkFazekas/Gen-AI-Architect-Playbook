---
name: new-lib
description: Create a new Nx Angular library with the workspace naming convention and mandatory scope/type tags. Use it whenever a new feature, ui, data-access or util library is needed.
---

1. Clarify (if not obvious): scope (`playbook` | `shared`), type (`feature` | `ui` | `data-access` | `util`), name (kebab-case).
2. Generate:
   - playbook scope:
     `npx nx g @nx/angular:lib libs/playbook/<name> --name=playbook-<name> --importPath=@playbook/<name> --prefix=pb --tags=scope:playbook,type:<type> --unitTestRunner=vitest-analog --no-interactive`
   - shared scope:
     `npx nx g @nx/angular:lib libs/shared/<name> --name=shared-<name> --importPath=@playbook/shared-<name> --prefix=pb --tags=scope:shared,type:<type> --unitTestRunner=vitest-analog --no-interactive`
3. Replace the generated `eslint.config.mjs` with the one the other libraries use (root config + `eslint.angular.mjs` + prettier).
4. In `vite.config.mts`, replace the deprecated Nx vite plugins with `tsconfigPaths()` from `vite-tsconfig-paths`, like the other libraries.
5. Add a `typecheck` target to `project.json`, like the other libraries.
6. A `util` library is pure TypeScript: remove `src/test-setup.ts` and its references.
7. Verify: `npx nx run-many -t lint typecheck test -p <project>`.
