# Angular quality baseline – javaslat (v3, Nx-szel)

> **Referencia:** a Python baseline a `MarkFazekas/ApplicantFilterSystemO/manager_backend` repóból
> (`.flake8`, `pyproject.toml`, `requirements/dev.txt`, `whitelist.txt`). Csak minta, a kód nem kerül át.
> **Cél:** ugyanazt a szigorúsági szintet hozni egy új Angular projektben, Nx monorepo-eszközzel.
> **Cél repó:** `Gen-AI-Architect-Playbook` (ez a repó). Az Nx workspace a repó gyökerében jön létre.
> **Rögzített döntések:** nincs Nx Cloud (`neverConnectToCloud`); Node 26 (LTS: 2026-10-28), nvm + `.nvmrc`; csomagkezelő npm (13. fejezet);
> stílus: SCSS (Sass modulrendszer) + stylelint, komponensenként külön `.ts` / `.html` / `.scss` fájl (6.8);
> UI: Angular Material 3, a színvilág egyetlen központi témából (`libs/shared/theme/`), a komponensekben csak tokenek (6.8c).
> nevek: `@playbook/*` import-scope, app `playbook`, selector prefix `pb` (5. fejezet); MCP: Nx + Angular CLI + Playwright (14. fejezet);
> AI tooling: Claude Code hookok (Pre/PostToolUse, Stop), permissions, CLAUDE.md, skill (15. fejezet).
> **Dátum:** 2026-10-17
> **Ellenőrzött verziók (npm, 2026-10-17):** `nx` / `@nx/angular` / `@nx/eslint-plugin` 23.3.0
> (`@angular/core` >= 20 < 23), `angular-eslint` 22.6.0, `@nx/eslint`: ESLint ^9 || ^10.
> **v2 változások:** beolvasztva a „B” javaslat erősségei (Zod, `npm audit`, architektúra-réteg, axe,
> e2e), és az Nx lett a gerinc. A dependency-cruiser helyett az `@nx/enforce-module-boundaries`
> szabályt használjuk (lásd 11. fejezet).
> **v3 változások:** telepítés ebbe a repóba (`nx init`); Nx Cloud kikapcsolva; saját workspace
> ESLint-szabályok a wemake-hiányokra (6.14); precíz cache-inputok (`namedInputs`); Playwright
> Atomizer (`e2e-ci`); Nx-kihasználtsági áttekintés (12.); Node/csomagkezelő döntés (13.).

---

## 1. Összefoglaló

A Python baseline szigorát négy rétegre bontjuk. Mindegyiknek megvan a saját eszköze:

| Réteg | Mit véd | Python (mai repó) | Angular + Nx |
|---|---|---|---|
| **1. Type safety** | típushibák, `any`, template-kötések | mypy `strict` + pydantic plugin | `tsc` szigorú `tsconfig`, Angular `strictTemplates`, type-aware ESLint |
| **2. Code quality** | komplexitás, bugminták, stílus, docstring | ruff `ALL`, flake8 + wemake + pluginek | ESLint: typescript-eslint `strictTypeChecked`, angular-eslint, sonarjs, unicorn, jsdoc, import-x, rxjs-x; Prettier, cspell, stylelint |
| **3. Architecture quality** | rétegek és modulhatárok, körkörös függőségek, holt kód | – | **Nx** `@nx/enforce-module-boundaries` (tagek), `import-x/no-cycle`, knip |
| **4. Runtime és felhasználói minőség** | megbízhatatlan API-adatok, a11y, kritikus folyamatok, függőség-sérülékenység | Pydantic (runtime), pytest, moto | **Zod**, Vitest, Playwright + **axe**, `npm audit` |

Mindezt az **Nx** futtatja: cache-eli a lint/test/build/typecheck taskokat, és CI-ban `nx affected` alapján csak azt ellenőrzi, amit a változás érint.

**Javasolt stack:** Nx (`@nx/angular`, `@nx/eslint`, `@nx/eslint-plugin`, `@nx/playwright`) + ESLint (typescript-eslint `strictTypeChecked`, angular-eslint `tsAll`/`templateAll`, sonarjs, unicorn, jsdoc, import-x, simple-import-sort, rxjs-x, `@vitest/eslint-plugin`) + Prettier + cspell + stylelint + knip + Zod + Vitest + Playwright/axe + commitlint/husky/lint-staged + `npm audit`.

---

## 2. Miért Nx?

Az Nx mindent tud, amit az Angular CLI, és hozzáteszi azt, ami a quality baseline-hoz kell:

| Képesség | Angular CLI | Nx | Mire jó a baseline-ban |
|---|---|---|---|
| Generátorok, build/serve/test | ✅ | ✅ | ugyanaz |
| **Enforced module boundaries** | ❌ | ✅ | a 3. réteg (architektúra) natív megoldása |
| **`nx affected`** | ❌ | ✅ | CI-ban csak az érintett projektek lint/test/build-je fut |
| **Lokális és remote cache** | ❌ | ✅ | a szigorú (lassú, type-aware) lint is gyors marad |
| Projektgráf (`nx graph`) | ❌ | ✅ | a függőségek vizualizálása |
| `nx migrate` (kód-migrációkkal) | ✅ (`ng update`) | ✅ (bővített) | Angular, angular-eslint, ESLint frissítés automatikusan |
| `nx sync` / `nx sync:check` | ❌ | ✅ | a generált konfigok (pl. TS project references) szinkronban tartása |

Ugyanez Pythonban: a mai repóban nincs architektúra-ellenőrzés. A legközelebbi megfelelő az import-linter lenne, a task-orkesztrációé pedig a nox/tox, illetve monorepo-szinten a pants.

**Ár:** több konfigurációs fájl (`nx.json`, `project.json`-ok, projektenkénti `eslint.config.mjs`), és egy plusz eszköz, amit verzióban szinkronban kell tartani (`nx migrate`). Egyetlen, sosem bővülő alkalmazásnál ez overhead lehet. Ha lesz shared UI, data-access réteg vagy második app, akkor megtérül.

---

## 3. Eszköz-szintű megfeleltetés

| Python eszköz / beállítás | Angular + Nx megfelelő | Megjegyzés |
|---|---|---|
| **mypy `strict = true`** | `tsconfig.base.json` `strict: true` + extra flagek | 6.2 |
| mypy `plugins = ['pydantic.mypy']` | `angularCompilerOptions.strictTemplates` (+ `typeCheckHostBindings`) | framework-specifikus statikus típusellenőrzés |
| mypy `disallow_any_generics` | `@typescript-eslint/no-explicit-any`, `no-unsafe-*` | strictTypeChecked része |
| mypy `warn_unused_ignores` | `linterOptions.reportUnusedDisableDirectives: "error"`, `@typescript-eslint/ban-ts-comment` | |
| mypy `warn_redundant_casts` | `@typescript-eslint/no-unnecessary-type-assertion` | strictTypeChecked része |
| mypy `no_implicit_reexport` | `@typescript-eslint/consistent-type-exports`, `isolatedModules` | |
| **Pydantic (runtime validáció)** | **Zod** sémák a `data-access` libekben | 6.10; a TS típusok futásidőben eltűnnek |
| **ruff `select = ["ALL"]`** | typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, angular-eslint `tsAll` + `templateAll` | az „ALL + ignore lista” filozófia az angular-eslintnél 1:1 megvan (döntési pont: 10. fejezet) |
| **ruff format** | Prettier, `nx format:check` / `nx format:write` | |
| ruff `I` (isort, fixable) | `simple-import-sort` | `eslint --fix` javítja |
| ruff `TC` (fixable) | `@typescript-eslint/consistent-type-imports` | `eslint --fix` javítja |
| ruff `unfixable = ["B"]` | nincs szabályonkénti fix-tiltás | CI-ban az ESLint `--fix` nélkül fut |
| ruff `dummy-variable-rgx` | `@typescript-eslint/no-unused-vars` `^_` mintákkal | |
| ruff `mccabe` 10 / flake8 `max_complexity = 8` | `complexity: 8` | a szigorúbb (flake8) érték |
| ruff `pydocstyle convention = google` | `eslint-plugin-jsdoc` | JSDoc/TSDoc a Google docstring helyett |
| **wemake-python-styleguide** | ESLint core limitek + sonarjs + unicorn + `id-denylist` | 4. fejezet |
| flake8-bugbear | strictTypeChecked (`no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check`) + sonarjs + rxjs-x | |
| flake8-print | `no-console` | döntési pont: `warn`/`error` engedése (10. fejezet) |
| flake8-eradicate | `sonarjs/no-commented-code` | **nem** a `no-warning-comments`, az TODO/FIXME-t jelez |
| flake8-builtins | `@typescript-eslint/no-shadow`, `no-shadow-restricted-names`, `no-restricted-globals` | |
| flake8-annotations | `explicit-function-return-type`, `explicit-module-boundary-types`, `explicit-member-accessibility` | a TS inferencia miatt a `strict` önmagában nem elég |
| flake8-comprehensions | unicorn (`prefer-array-flat-map`, `no-array-for-each`, …), `@typescript-eslint/prefer-*` | |
| flake8-assertive | `@vitest/eslint-plugin` (`prefer-to-be`, `prefer-to-have-length`, `prefer-strict-equal`, …) | |
| flake8-spellcheck + `whitelist.txt` | cspell + `cspell.json` `words` | |
| flake8-pydantic (Pydantic-kód lintolása) | angular-eslint framework-szabályok (`prefer-signals`, `prefer-standalone`, `prefer-on-push-component-change-detection`, …) | „framework-specifikus lint” analógia |
| pep8-naming | `@typescript-eslint/naming-convention`, angular-eslint selector/suffix szabályok | |
| gitlint | commitlint (`commit-msg` hook + CI) | |
| pytest / pytest-mock | Vitest (`vitest-angular`, az `@angular/build:unit-test` executorral), `vi.fn()` / `vi.spyOn()` | Nx: Angular 21+ esetén ez az alapértelmezett |
| moto | `HttpTestingController` vagy MSW | |
| – (import-linter) | **`@nx/enforce-module-boundaries`** + `import-x/no-cycle` | 6.4 |
| – (nox/tox/pants) | **Nx** taskok, cache, `nx affected` | |
| – (pip-audit) | **`npm audit --audit-level=high`** | érdemes a Python oldalra is betenni a pip-auditot |
| `.python-version` | `.nvmrc` + `engines` | |
| pinned `requirements/dev.txt` | `package-lock.json` + `.npmrc` `save-exact=true` | |

**Frontend-specifikus kiegészítések** (a Python repóban nincs párjuk):

- **Accessibility:** angular-eslint `templateAccessibility` (statikus) + `@axe-core/playwright` (futásidejű, WCAG 2.1 AA)
- **E2E:** Playwright (az Nx generátor alapból `apps/<app>-e2e` projektet hoz létre)
- **knip:** nem használt fájlok, exportok és függőségek (az Nx pluginja automatikusan bekapcsol)
- **stylelint:** SCSS lint
- **eslint-plugin-rxjs-x:** RxJS hibák (el nem engedett subscription, `takeUntil` sorrend stb.)

---

## 4. A `.flake8` limitek átvétele

| `.flake8` / wemake beállítás | Érték | ESLint megfelelő | Pontosság |
|---|---|---|---|
| `max_complexity` | 8 | `complexity: ["error", 8]` | pontos |
| wemake `max-cognitive-score` (alapért.) | 12 | `sonarjs/cognitive-complexity: ["error", 12]` | pontos (a SonarJS saját alapértéke 15) |
| `max_line_length` | 120 | Prettier `printWidth: 120` | pontos |
| `inline-quotes` | double | Prettier `singleQuote` | **döntési pont** (10. fejezet) |
| `max-string-usages` (WPS226) | 5 | `sonarjs/no-duplicate-string: { threshold: 5 }` | pontos |
| `max-name-length` (WPS118) | 50 | `id-length: { max: 50 }` | pontos |
| wemake `min-name-length` (alapért.) | 2 | `id-length: { min: 2 }` | pontos |
| WPS110 (tiltott nevek: `data`, `result`, `value`, …) | – | `id-denylist` | pontos |
| `max-imports` (WPS201) | 15 | `import-x/max-dependencies: { max: 15 }` | pontos |
| wemake `max-arguments` (alapért.) | 5 | `max-params: ["error", 5]` | pontos |
| wemake `max-asserts` (alapért.) | 5 | `vitest/max-expects: { max: 5 }` | pontos |
| wemake `max-offset-blocks` (alapért.) | 5 | `max-depth: ["error", 4]` | közelítő |
| `max-module-members` (WPS202) | 20 | `max-lines: 300` + `max-classes-per-file: 1` (később: workspace rule) | proxy |
| `max-methods` (WPS214) | 10 | `workspace/max-methods: { max: 10 }` (saját szabály, 6.14) | pontos |
| `max-local-variables` (WPS210) | 10 | saját szabály, a 6.14 mintájára (`workspace/max-local-variables`) | megírandó |
| `max-try-body-length` (WPS229) | 2 | saját szabály, a 6.14 mintájára (`workspace/max-try-body-length`) | megírandó |
| `max-import-from-members` (WPS235) | 15 | saját szabály, a 6.14 mintájára (`ImportDeclaration.specifiers.length`) | megírandó |
| `max-line-complexity` (WPS221) | 13 | – (a wemake saját AST-mérőszáma, nem éri meg átírni) | **nincs megfelelő** |
| `docstring-convention` | google | `eslint-plugin-jsdoc` | konvenció-különbség |
| `strictness = long` (darglint) | – | `jsdoc/require-param`, `jsdoc/require-returns` | közelítő |

**Az ignorált szabályok átvétele:**

| Python ignore | Angular megfelelő |
|---|---|
| `E501` line length | nincs külön lint szabály, a Prettier kezeli |
| `B042` exception `__init__` | nem releváns |
| `N818` exception név `Error` suffix | a `naming-convention` nem kényszerít suffixot az Error osztályokra |
| `ANN101`, `ANN102` (self, cls) | nem releváns |
| `WPS305`, `WPS237` f-string | template literal engedett, sőt a `prefer-template` kötelezővé teszi |
| `D211`, `D213` | nem releváns |
| `D104` package docstring | nincs fájlszintű doc kényszer |
| `CPY001` copyright header | nincs header-szabály |
| `S101` assert | nem releváns |
| `COM812` (formatter-konfliktus) | `eslint-config-prettier` minden config végén |
| tests: `S101`, `WPS235`, `WPS201` | `*.spec.ts` override (6.3) |

---

## 5. Workspace-struktúra

**Névkonvenciók** (a repó nevéből, `Gen-AI-Architect-Playbook`):

| Elem | Szabály | Érték |
|---|---|---|
| Repó | GitHub-név (változatlan) | `Gen-AI-Architect-Playbook` |
| Root `package.json` `name` | npm: csak kisbetű; scope-olt, hogy az Nx ebből vegye az import-scope-ot | `@playbook/source` |
| Import alias (libek) | `@playbook/<lib>`, explicit `--importPath`-szal (a projektnévből a redundáns `playbook-` előtag elhagyva) | `@playbook/feature-patterns`, `@playbook/data-access`, `@playbook/shared-ui`, `@playbook/shared-util` |
| Nx projektnevek | kebab-case, `<scope>-<lib>` (egyediek a workspace-ben) | `playbook`, `playbook-e2e`, `playbook-feature-patterns`, `playbook-data-access`, `shared-ui`, `shared-util` |
| Angular selector prefix | rövid (Angular style guide), a „playbook” rövidítése | `pb`, pl. `<pb-pattern-card>`, `[pbTooltip]` |
| Tagek | `scope:<domain>`, `type:<réteg>` | `scope:playbook`, `scope:shared`, `type:app`/`feature`/`ui`/`data-access`/`util` |
| Fájlnevek | Angular style guide: kebab-case | `pattern-card.ts`, `pattern-api.ts` |

> Miért nem `playbook` a selector prefix is: minden komponens- és direktívanévben megjelenik (`<playbook-pattern-card>`, `[playbookTooltip]`), az Angular style guide rövid prefixet ajánl. Ha mégis a teljes szó kell, csak a `--prefix` és a két `*-selector` ESLint-szabály értéke változik.

Az Nx ajánlása: az alkalmazás vékony, a logika domain szerint csoportosított, kis libekben él. Minden projekt két taget kap: `scope:*` (domain) és `type:*` (réteg).

```
Gen-AI-Architect-Playbook/
├── apps/
│   ├── playbook/                    tags: scope:playbook, type:app
│   └── playbook-e2e/                Playwright + axe
├── libs/
│   ├── playbook/
│   │   ├── feature-patterns/        tags: scope:playbook, type:feature
│   │   └── data-access/             tags: scope:playbook, type:data-access   ← Zod sémák, HttpClient
│   └── shared/
│       ├── theme/                   tags: scope:shared,  type:theme        ← központi Material téma (6.8c), csak SCSS
│       ├── ui/                      tags: scope:shared,  type:ui           ← csak prezentációs komponensek
│       └── util/                    tags: scope:shared,  type:util         ← tiszta TS
├── tools/
│   └── eslint-rules/                saját workspace ESLint-szabályok (wemake-hiányok, 6.14)
├── eslint.config.mjs                közös TS/minőségi szabályok + modulhatárok
├── eslint.angular.mjs               közös Angular-szabályok (ts + template)
├── nx.json
├── tsconfig.base.json               szigorú compilerOptions + path aliasok
├── cspell.json
├── commitlint.config.mjs
└── package.json
```

**Rétegszabályok** (6.4 a konfig):

| Réteg | Mitől függhet | Tiltott külső import |
|---|---|---|
| `type:app` | feature, ui, data-access, util | – |
| `type:feature` | ui, data-access, util (más feature-től **nem**) | – |
| `type:ui` | ui, util | `@angular/common/http`, `@angular/router`, `zod` |
| `type:data-access` | data-access, util | – |
| `type:util` | util | `@angular/*` |
| `scope:shared` | csak `scope:shared` | – |
| `scope:playbook` | `scope:playbook`, `scope:shared` | – |

---

## 6. Konfigurációs fájlok

### 6.0 Telepítés

**Ebbe a repóba (`Gen-AI-Architect-Playbook`, a gyökérben):**

```bash
echo 26 > .nvmrc
nvm install && nvm use          # .nvmrc alapján (13. fejezet)
# .gitignore: a "/package-lock.json" sort TÖRÖLNI kell (a lockfile commitolandó: npm ci, save-exact, npm audit)
npm init -y
npm pkg set name="@playbook/source"
npm pkg set private=true --json
npx nx@latest init              # interaktív; az Nx Cloud kérdésre: No (a .gitignore-ba felveszi a .nx/ cache-könyvtárakat)
# nx.json: "neverConnectToCloud": true  (6.1)

nx add @nx/angular
nx add @nx/eslint-plugin @nx/devkit

# Alkalmazás (a flagek az @nx/angular 23.3 app-generátor sémájából)
nx g @nx/angular:app apps/playbook \
  --strict --style=scss --prefix=pb \
  --unitTestRunner=vitest-angular --e2eTestRunner=playwright \
  --linter=eslint --formatter=prettier \
  --tags=scope:playbook,type:app

# Libek
S=@playbook
nx g @nx/angular:lib libs/playbook/feature-patterns --name=playbook-feature-patterns --importPath=$S/feature-patterns \
  --prefix=pb --tags=scope:playbook,type:feature --unitTestRunner=vitest-angular
nx g @nx/angular:lib libs/playbook/data-access --name=playbook-data-access --importPath=$S/data-access \
  --prefix=pb --tags=scope:playbook,type:data-access --unitTestRunner=vitest-angular
nx g @nx/angular:lib libs/shared/ui --name=shared-ui --importPath=$S/shared-ui \
  --prefix=pb --tags=scope:shared,type:ui --unitTestRunner=vitest-angular
nx g @nx/angular:lib libs/shared/util --name=shared-util --importPath=$S/shared-util \
  --prefix=pb --tags=scope:shared,type:util --unitTestRunner=vitest-angular

# Minőségi eszközök
npm i -D --save-exact \
  typescript-eslint @eslint/js \
  eslint-plugin-sonarjs eslint-plugin-unicorn eslint-plugin-jsdoc \
  eslint-plugin-rxjs-x eslint-plugin-import-x eslint-import-resolver-typescript \
  eslint-plugin-simple-import-sort @vitest/eslint-plugin eslint-config-prettier \
  cspell knip \
  stylelint stylelint-config-standard-scss stylelint-config-recess-order stylelint-order stylelint-declaration-strict-value \
  husky lint-staged @commitlint/cli \
  @axe-core/playwright @typescript-eslint/utils
npm i --save-exact zod

npx husky init
```

**Más kiinduló helyzetekre (itt nem kell):** új, üres repóhoz `npx create-nx-workspace@latest <workspace> --preset=apps`; a hivatalos Angular tutorial sablonja (példa appokkal) `--template=nrwl/angular-template`; meglévő Angular CLI projekthez `npx nx@latest init --integrated`.

> Az Nx csomagokat mindig `nx add` paranccsal és azonos verzión tartsd. Frissítés: `nx migrate latest`, majd `nx migrate --run-migrations`. Néhány angular-eslint szabálynév verziófüggő; az első `nx run-many -t lint` futás jelzi, ha egy szabály nem létezik.

### 6.1 `nx.json` (kiegészítések a generálthoz)

```jsonc
{
  "defaultBase": "main",
  "neverConnectToCloud": true,            // Nx Cloud szándékosan nincs; minden Cloud-csatlakozási kísérlet hibát ad
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json", "{workspaceRoot}/.nvmrc"],
    // a build cache-t ne invalidálja teszt-, lint- vagy tesztkonfig-változás
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/eslint.config.mjs",
      "!{projectRoot}/vitest.config.*"
    ]
  },
  "plugins": [
    // a generátorok felveszik; ellenőrizd, hogy benne vannak
    { "plugin": "@nx/eslint/plugin", "options": { "targetName": "lint" } },
    // e2e-ci: Atomizer, spec-fájlonként külön (cache-elhető, párhuzamosítható) task
    { "plugin": "@nx/playwright/plugin", "options": { "targetName": "e2e", "ciTargetName": "e2e-ci" } }
  ],
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    },
    "lint": {
      // a közös ESLint-konfigok változása minden projekt lint-cache-ét invalidálja
      "inputs": [
        "default",
        "{workspaceRoot}/eslint.config.mjs",
        "{workspaceRoot}/eslint.angular.mjs",
        "{workspaceRoot}/tools/eslint-rules/**/*"
      ]
    },
    "typecheck": {
      "cache": true,
      "inputs": ["default", "^default", "{workspaceRoot}/tsconfig.base.json"]
    }
  }
}
```

**`typecheck` target** projektenként (`apps/playbook/project.json`; libeknél `tsconfig.lib.json`):

```jsonc
{
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "tsc -p {projectRoot}/tsconfig.app.json --noEmit",
          "tsc -p {projectRoot}/tsconfig.spec.json --noEmit"
        ],
        "parallel": false
      }
    }
  }
}
```

> Fontos: a template-ek típusellenőrzése nem a `tsc`-ben, hanem az Angular fordítóban (`nx build`) fut. A mypy-gate megfelelője ezért: `typecheck` **és** `build`.

### 6.2 TypeScript (mypy strict megfelelő)

`tsconfig.base.json`, kiegészítés a generált `compilerOptions`-höz (a `paths`, `target` stb. maradjon a generált):

```jsonc
{
  "compilerOptions": {
    // --- mypy strict = true ---
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    // --- extra szigorítás ---
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,   // döntési pont (10. fejezet)
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
    // noUnusedLocals / noUnusedParameters: szándékosan nincs bekapcsolva; az ESLint no-unused-vars kezeli,
    // a ruff dummy-variable-rgx mintájára _ prefix kivétellel (a tsc a _ lokális változókat nem engedi)
  }
}
```

`apps/playbook/tsconfig.json` (és libeknél ugyanez), a „pydantic.mypy plugin” megfelelője, vagyis a template-ek típusellenőrzése:

```jsonc
{
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "typeCheckHostBindings": true,
    "extendedDiagnostics": {
      "defaultCategory": "error"
    }
  }
}
```

### 6.3 `eslint.config.mjs` (root: közös minőségi szabályok + modulhatárok)

```js
// @ts-check
import eslint from "@eslint/js";
import nx, { loadWorkspaceRules } from "@nx/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier/flat";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import rxjsX from "eslint-plugin-rxjs-x";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// saját szabályok a wemake-hiányokra (6.14)
const workspaceRules = await loadWorkspaceRules("tools/eslint-rules");

export default defineConfig([
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  globalIgnores(["**/dist", "**/.angular", "**/coverage", "**/.nx", "**/node_modules"]),

  // mypy warn_unused_ignores
  { linterOptions: { reportUnusedDisableDirectives: "error" } },

  // ---------------------------------------------------------------- 3. réteg: architektúra
  {
    files: ["**/*.ts"],
    rules: {
      "@nx/enforce-module-boundaries": ["error", {
        enforceBuildableLibDependency: true,
        banTransitiveDependencies: true,      // csak a package.json-ban deklarált csomag importálható
        checkNestedExternalImports: true,     // a bannedExternalImports az al-útvonalakra is (pl. @angular/common/http)
        allow: [],
        depConstraints: [
          { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
          { sourceTag: "scope:playbook", onlyDependOnLibsWithTags: ["scope:playbook", "scope:shared"] },
          { sourceTag: "type:app", onlyDependOnLibsWithTags: ["type:feature", "type:ui", "type:data-access", "type:util"] },
          { sourceTag: "type:feature", onlyDependOnLibsWithTags: ["type:ui", "type:data-access", "type:util"] },
          {
            sourceTag: "type:ui",
            onlyDependOnLibsWithTags: ["type:ui", "type:util"],
            bannedExternalImports: ["@angular/common/http", "@angular/router", "zod"],
          },
          { sourceTag: "type:data-access", onlyDependOnLibsWithTags: ["type:data-access", "type:util"] },
          { sourceTag: "type:util", onlyDependOnLibsWithTags: ["type:util"], bannedExternalImports: ["@angular/*"] },
        ],
      }],
      "import-x/no-cycle": "error",          // projekten belüli körkörös importok (projektek között az Nx szabály fogja)
    },
  },

  // ---------------------------------------------------------------- 1–2. réteg: TypeScript
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      sonarjs.configs.recommended,
      unicorn.configs.recommended,
      jsdoc.configs["flat/recommended-typescript-error"],
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
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      workspace: { rules: workspaceRules },
    },
    rules: {
      // --- mccabe / wemake limitek (.flake8 értékei) ---
      complexity: ["error", 8],                                       // max_complexity = 8
      "workspace/max-methods": ["error", { max: 10 }],                // max-methods = 10 (WPS214)
      "sonarjs/cognitive-complexity": ["error", 12],                  // wemake max-cognitive-score
      "max-params": ["error", 5],                                     // wemake max-arguments
      "max-depth": ["error", 4],                                      // wemake max-offset-blocks (közelítő)
      "max-nested-callbacks": ["error", 3],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }], // max-module-members proxy
      "max-classes-per-file": ["error", 1],
      "id-length": ["error", { min: 2, max: 50, exceptions: ["_"] }], // max-name-length = 50
      "id-denylist": ["error", "data", "result", "results", "value", "values", "item", "items",
        "obj", "handle", "handler", "temp", "tmp", "foo", "bar", "baz", "info", "content"], // WPS110
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],     // max-string-usages = 5
      "import-x/max-dependencies": ["error", { max: 15, ignoreTypeImports: true }], // max-imports = 15

      // --- flake8-eradicate ---
      "sonarjs/no-commented-code": "error",

      // --- flake8-print ---
      "no-console": "error",

      // --- flake8-builtins ---
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      "no-shadow-restricted-names": "error",
      "no-restricted-globals": ["error", "event", "name", "status", "length"],

      // --- flake8-annotations ---
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],

      // --- ruff TC ---
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/consistent-type-exports": "error",

      // --- ruff I (isort) ---
      "import-x/order": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // --- ruff dummy-variable-rgx ---
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],

      // --- flake8-bugbear szellemében ---
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/prefer-readonly": "error",
      eqeqeq: ["error", "always"],
      "no-param-reassign": "error",
      "no-implicit-coercion": "error",
      "prefer-template": "error",                                     // WPS305 ignore megfelelője

      // --- pep8-naming ---
      "@typescript-eslint/naming-convention": ["error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "variable", modifiers: ["const", "global"], format: ["camelCase", "UPPER_CASE"] },
        { selector: "classProperty", modifiers: ["static", "readonly"], format: ["camelCase", "UPPER_CASE"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: ["objectLiteralProperty", "typeProperty"], format: null }, // API payload kulcsok (snake_case backend)
        { selector: "import", format: null },
      ],

      // --- pydocstyle (google) megfelelő ---
      "jsdoc/require-jsdoc": ["error", {
        publicOnly: true,
        require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
      }],
      "jsdoc/require-description": "error",

      // --- unicorn: Angular-kompatibilitás ---
      "unicorn/no-null": "off",                                       // Angular forms / signals null-t használ
      "unicorn/prevent-abbreviations": "off",                         // id-denylist + id-length kezeli
      "unicorn/prefer-top-level-await": "off",
    },
  },

  // ---------------------------------------------------------------- Tesztek (per-file-ignores)
  {
    files: ["**/*.spec.ts"],
    extends: [vitest.configs.recommended],
    rules: {
      // flake8-assertive megfelelő
      "vitest/prefer-to-be": "error",
      "vitest/prefer-to-have-length": "error",
      "vitest/prefer-to-contain": "error",
      "vitest/prefer-strict-equal": "error",
      "vitest/prefer-comparison-matcher": "error",
      "vitest/prefer-equality-matcher": "error",
      "vitest/max-expects": ["error", { max: 5 }],                    // wemake max-asserts

      // .flake8 per-file-ignores: WPS201, WPS235
      "import-x/max-dependencies": "off",
      // tesztekben megengedett lazítások
      "max-nested-callbacks": "off",
      "max-lines": "off",
      "sonarjs/no-duplicate-string": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/unbound-method": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },

  // ruff COM812 megfelelője: formázó-konfliktusok kikapcsolása (mindig utolsó)
  prettier,
]);
```

### 6.4 `eslint.angular.mjs` (közös Angular-szabályok)

```js
// @ts-check
import nx from "@nx/eslint-plugin";
import angular from "angular-eslint";
import { defineConfig } from "eslint/config";

// Az Nx presetek: flat/angular = angular-eslint tsRecommended + inline template processor,
// flat/angular-template = templateRecommended + templateAccessibility.
// Fölé tesszük a "ruff ALL" megfelelőjét (tsAll / templateAll) indokolt ignore listával.
export default defineConfig([
  ...nx.configs["flat/angular"],
  ...nx.configs["flat/angular-template"],
  {
    files: ["**/*.ts"],
    extends: [angular.configs.tsAll],
    rules: {
      "@angular-eslint/require-localize-metadata": "off",             // csak @angular/localize használatakor
      "@angular-eslint/runtime-localize": "off",                      // csak @angular/localize használatakor
      // külön .ts / .html / .scss fájl kötelező (6.8)
      "@angular-eslint/component-max-inline-declarations": ["error", { template: 0, styles: 0, animations: 0 }],
      // Angular v20+ style guide: nincs "Component" / "Directive" osztály-suffix
      "@angular-eslint/component-class-suffix": "off",
      "@angular-eslint/directive-class-suffix": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [angular.configs.templateAll],
    rules: {
      "@angular-eslint/template/cyclomatic-complexity": ["error", { maxComplexity: 8 }],
      "@angular-eslint/template/i18n": "off",                         // csak @angular/localize használatakor
      "@angular-eslint/template/no-call-expression": "off",           // signals miatt a hívás a template-ben normális
    },
  },
]);
```

### 6.5 Projekt-szintű `eslint.config.mjs` (pl. `apps/playbook/`)

```js
// @ts-check
import prettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

import angularConfig from "../../eslint.angular.mjs";
import baseConfig from "../../eslint.config.mjs";

export default defineConfig([
  ...baseConfig,
  ...angularConfig,
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/component-selector": ["error", { type: "element", prefix: "pb", style: "kebab-case" }],
      "@angular-eslint/directive-selector": ["error", { type: "attribute", prefix: "pb", style: "camelCase" }],
    },
  },
  prettier,
]);
```

> A libeknél ugyanez, a mélységnek megfelelő relatív úttal (`../../../`), és opcionálisan saját selector-prefixszel.
> **ESLint 10 ajánlott:** ott alapértelmezett, hogy a config a lintelt fájltól felfelé keresve töltődik be. Így a root-ból futtatott `eslint` (lint-staged) is a projekt-szintű Angular-szabályokat használja.

### 6.6 `.prettierrc.json` (ruff format)

```json
{
  "printWidth": 120,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "overrides": [
    { "files": "*.html", "options": { "parser": "angular" } }
  ]
}
```

`.prettierignore`:

```
dist
coverage
.angular
.nx
package-lock.json
```

### 6.7 `cspell.json` (flake8-spellcheck + whitelist.txt)

```json
{
  "version": "0.2",
  "language": "en",
  "dictionaries": ["typescript", "node", "npm", "html", "css", "scss", "softwareTerms", "fullstack", "companies"],
  "words": [
    "nrwl",
    "zoneless"
  ],
  "ignorePaths": ["node_modules", "dist", "coverage", ".angular", ".nx", "package-lock.json"]
}
```

> A `dictionaries=en_US,python,technical,pandas` megfelelője: `typescript`, `node`, `softwareTerms`, `fullstack` (az `en_US` alapból aktív).

### 6.8 Stílusok (SCSS + stylelint) és a komponens-fájlstruktúra

**Döntés: SCSS.** A „Sass” a nyelv neve, két szintaxissal: az **SCSS** (`.scss`, CSS-szuperhalmaz, kapcsos zárójelek) az iparági alapértelmezés, az indentált `.sass` szintaxis ritka. Miért SCSS:

- az Angular CLI és az Nx első osztályú opciója (`--style=scss`);
- az Angular Material theming API-ja Sass-alapú (`@use "@angular/material" as mat`), így egy későbbi Material-bevezetés nem igényel váltást;
- a Prettier formázza, és van hozzá érett stylelint-konfig.

**Modern CSS-sel együtt használjuk:** design tokenek CSS custom propertyként (`--pb-color-primary`), natív nesting, `@layer`, container queries. A Sass a modulrendszerért (`@use` / `@forward`), a mixinekért és a buildidejű számításokért kell. A Sass `@import` elavult (Dart Sass 1.80 óta deprecated, a 3.0-ban megszűnik), ezért a stylelint tiltja.

**Mérlegelt alternatívák:** a sima CSS kevesebb tooling, de nincs modulrendszer és mixin. A Tailwind (v4) utility-first megközelítés, és a teljes stíluskezelést másképp szervezi (osztályok a template-ben, nem komponens-SCSS). **Döntés: Angular Material** (Material 3) + SCSS, központi témával (6.8c).

`.stylelintrc.json` (SCSS lint; a Python oldalon nincs párja):

```jsonc
{
  "extends": ["stylelint-config-standard-scss", "stylelint-config-recess-order"],
  "plugins": ["stylelint-declaration-strict-value"],
  "rules": {
    // szerkezeti limitek (a wemake/complexity szellemében)
    "max-nesting-depth": [3, { "ignore": ["pseudo-classes"] }],
    "selector-max-compound-selectors": 3,
    "selector-max-id": 0,
    "selector-no-qualifying-type": true,
    "declaration-no-important": true,
    // Sass @import elavult → @use / @forward
    "at-rule-disallowed-list": ["import"],
    // ::ng-deep tiltva: megkerüli a komponens view encapsulationt
    "selector-pseudo-element-no-unknown": [true, { "ignorePseudoElements": ["ng-deep"] }],
    "selector-pseudo-element-disallowed-list": ["ng-deep"],
    // design tokenek kikényszerítése (6.8c): nyers szín, gradient, árnyék, sarok, font csak a theme libben lehet
    "color-named": "never",
    "color-no-hex": true,
    "function-disallowed-list": ["/^(rgba?|hsla?|hwb|lab|lch|oklab|oklch)$/", "/gradient$/"],
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "fill", "stroke", "z-index", "font", "font-family", "border-radius", "box-shadow"],
      { "ignoreValues": ["currentColor", "inherit", "initial", "unset", "transparent", "none", "0"] }
    ]
  },
  "overrides": [
    {
      // a központi téma az egyetlen hely, ahol nyers érték állhat
      "files": ["libs/shared/theme/**/*.scss"],
      "rules": {
        "color-no-hex": null,
        "function-disallowed-list": null,
        "scale-unlimited/declaration-strict-value": null
      }
    }
  ]
}
```

| stylelint-modul | Szerep | Python-analógia |
|---|---|---|
| `stylelint-config-standard-scss` | hibák, elavult szintaxis, kebab-case osztálynevek, SCSS-specifikus szabályok | ruff/flake8 alapszabályok |
| `stylelint-config-recess-order` (+ `stylelint-order`) | CSS-tulajdonságok determinisztikus sorrendje, `--fix`-szel javítható | isort |
| `stylelint-declaration-strict-value` | nyers színérték, z-index vagy font helyett token kötelező | – (wemake „magic number” szellemében) |
| Prettier | formázás (a stylelint 16+ már nem foglalkozik stílusformázással, így nincs ütközés) | ruff format |

**Külön `.ts` / `.html` / `.scss` fájl kikényszerítése** (az `eslint.angular.mjs` `tsAll` blokkjába, 6.4):

```js
// minden template és stílus külön fájlban: inline template / styles / animations egy sor sem lehet
"@angular-eslint/component-max-inline-declarations": ["error", { template: 0, styles: 0, animations: 0 }],
// Angular v20+ style guide: nincs "Component" / "Directive" osztály-suffix (UserProfile, nem UserProfileComponent)
"@angular-eslint/component-class-suffix": "off",
"@angular-eslint/directive-class-suffix": "off",
```

Az alapértelmezett limit 3 sor; 0 értékkel bármilyen inline `template` vagy `styles` hiba, vagyis kötelező a `templateUrl` és a `styleUrl`. A többi kapcsolódó szabály már a `tsAll` / `templateAll` része:

- `consistent-component-styles`: egységes `styleUrl` használat;
- `relative-url-prefix`: `./` előtag a fájlhivatkozásokban;
- `template/no-inline-styles`: nincs `style="..."` attribútum a HTML-ben.

Üres `.scss` fájlt nem kényszerítünk ki: ha egy komponensnek nincs saját stílusa, a stílusfájl elhagyható, de inline stílus akkor sem lehet.

**Generátor-alapértékek** (`nx.json`), hogy az `nx g` (és az AI agent) eleve ezt a struktúrát generálja:

```jsonc
{
  "generators": {
    "@nx/angular:application": { "style": "scss", "strict": true, "prefix": "pb", "linter": "eslint", "unitTestRunner": "vitest-angular", "e2eTestRunner": "playwright" },
    "@nx/angular:library": { "style": "scss", "strict": true, "prefix": "pb", "linter": "eslint", "unitTestRunner": "vitest-angular", "changeDetection": "OnPush" },
    "@nx/angular:component": { "style": "scss", "inlineStyle": false, "inlineTemplate": false, "changeDetection": "OnPush", "skipTests": false }
  }
}
```

Az eredmény komponensenként (Angular v20+ fájlnév-konvenció, suffix nélkül):

```
libs/shared/ui/src/lib/pattern-card/
├── pattern-card.ts        export class PatternCard, selector: "pb-pattern-card"
├── pattern-card.html
├── pattern-card.scss
└── pattern-card.spec.ts
```

> A `tsAll` két további szabálya is érdemi: a `no-experimental` és a `no-developer-preview` tiltja az experimental és developer preview Angular API-kat (pl. új, még nem stabil form API-k). Ez a stabilitást védi, és szándékos, ha nincs kikapcsolva.

### 6.8c Angular Material és a központi téma (színvilág)

**Cél:** a színvilág, a tipográfia, a sarkok és a sűrűség **egyetlen helyen** legyen konfigurálható. A komponensek csak tokeneket használhatnak, ezt a stylelint kényszeríti ki (6.8). Így sem ember, sem AI agent nem tud „ad hoc” színeket, gradienseket és árnyékokat szórni a kódba. Ez az „AI slop” kinézet fő forrása.

**Telepítés:**

```bash
npm i --save-exact @angular/material @angular/cdk
npm i --save-exact @fontsource/ibm-plex-sans @fontsource/ibm-plex-serif material-symbols   # self-hosted fontok és ikonok (nincs Google Fonts hívás)
```

**Struktúra:** egy csak stílust tartalmazó Nx projekt, `libs/shared/theme/`:

```
libs/shared/theme/
├── project.json             name: shared-theme, tags: scope:shared, type:theme
└── src/
    ├── _theme-colors.scss   GENERÁLT palettából: ng g @angular/material:theme-color (kézzel nem szerkesztjük)
    ├── _tokens.scss         saját --pb-* tokenek (spacing, layout), a Material sys tokenekre építve
    └── theme.scss           A KÖZPONTI KONFIG: paletták, fontok, sarkok, sűrűség, világos/sötét, high contrast
```

**Színek cseréje, egyetlen paranccsal.** A Material 3 a megadott alapszínekből generál teljes, akadálymentes (kontrasztos) tonális palettát:

```bash
npx nx g @angular/material:theme-color \
  --primaryColor="#1F4E79" --tertiaryColor="#B5832A" --neutralColor="#5E6268" \
  --includeHighContrast --directory=libs/shared/theme/src
```

> A színek csak példák (mély kék + visszafogott okker + semleges szürke). A tényleges márkaszínek design-döntés. A generátor-flagek a Material 22.2.3 `theme-color` schematic sémájából valók.

`libs/shared/theme/src/theme.scss`:

```scss
// A KÖZPONTI TÉMA: színvilág, tipográfia, forma és sűrűség egyetlen forrása.
// Színek: ne itt írd át, hanem generáld újra a _theme-colors.scss-t (lásd a baseline 6.8c parancsát).
@use "@angular/material" as mat;
@use "./theme-colors" as brand;
@use "./tokens";

html {
  color-scheme: light dark; // a rendszerbeállítás szerinti világos/sötét mód; csak világos: light

  @include mat.theme(
    (
      color: (
        primary: brand.$primary-palette,
        tertiary: brand.$tertiary-palette,
      ),
      typography: (
        plain-family: (IBM Plex Sans, system-ui, sans-serif),
        brand-family: (IBM Plex Serif, Georgia, serif),
        bold-weight: 600,
      ),
      density: 0,
    )
  );

  // forma: visszafogottabb sarkok az M3 alapértelmezésnél (kevésbé "buborékos")
  @include mat.theme-overrides(
    (
      corner-extra-small: 2px,
      corner-small: 4px,
      corner-medium: 8px,
      corner-large: 12px,
    )
  );
}

@media (prefers-contrast: more) {
  html {
    @include brand.high-contrast-overrides(color-scheme);
  }
}
```

`libs/shared/theme/src/_tokens.scss` (amit a Material nem ad: spacing és layout):

```scss
html {
  --pb-space-1: 4px;
  --pb-space-2: 8px;
  --pb-space-3: 16px;
  --pb-space-4: 24px;
  --pb-space-5: 32px;
  --pb-space-6: 48px;
  --pb-content-max-width: 72rem;
}
```

**Bekötés az appba:**

- az `apps/playbook/project.json` build `styles` tömbjébe a `libs/shared/theme/src/theme.scss`, a font-csomagok CSS-e és a `material-symbols` kerül;
- ugyanitt `"implicitDependencies": ["shared-theme"]`, hogy témaváltozáskor az `nx affected` az appot is újraépítse és újratesztelje.

**Komponens-SCSS:** csak tokeneket használ:

```scss
// libs/shared/ui/src/lib/pattern-card/pattern-card.scss
:host {
  display: block;
  padding: var(--pb-space-3);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  box-shadow: var(--mat-sys-level1);
}

.title {
  font: var(--mat-sys-title-medium);
  color: var(--mat-sys-primary);
}
```

**Design-szabályok az „AI slop” kinézet ellen** (a `CLAUDE.md`-be is bekerülnek, 15.7):

| Szabály | Kikényszerítés |
|---|---|
| Nyers szín, `rgb()`/`hsl()`/`oklch()` csak a theme libben | stylelint: `color-no-hex`, `function-disallowed-list`, `declaration-strict-value` |
| Nincs gradient (pl. lila-kék háttér, színes szöveg-gradient) | stylelint: `function-disallowed-list` (`/gradient$/`) |
| Árnyék csak `--mat-sys-level0..5`, sarok csak `--mat-sys-corner-*` | stylelint: `declaration-strict-value` (`box-shadow`, `border-radius`) |
| Tipográfia csak a Material type scale-ből (`font: var(--mat-sys-body-medium)` stb.) | stylelint: `declaration-strict-value` (`font`, `font-family`) |
| Nincs inline stílus és `[style.*]` / `ngStyle` kötés | angular-eslint `template/no-inline-styles` |
| A téma módosítása csak emberi jóváhagyással | PreToolUse hook: a `libs/shared/theme/` védett (15.2) |
| Előbb Material komponens, saját csak ha nincs megfelelő | `CLAUDE.md` (review-szabály) |
| Visszafogott színhasználat: felületek neutral, a primary csak fő akciókhoz, az accent (tertiary) ritkán | `CLAUDE.md` (review-szabály) |
| Ikon: Material Symbols, nem emoji | `CLAUDE.md` (review-szabály) |
| Szándékosan választott betűpár (nem az alapértelmezett Roboto vagy az „AI-default” Inter), self-hosted | `theme.scss` + `@fontsource` |

> A táblázat felső fele gépileg kikényszerített, az alsó fele review-szabály. A Playwright MCP-vel (14. fejezet) az agent a kész képernyőt meg is nézheti, mielőtt késznek jelenti.

### 6.8b `knip.json`

```json
{
  "ignoreExportsUsedInFile": true
}
```

> A knip Nx és Angular pluginje automatikusan bekapcsol. A találatokat Angular-specifikus hivatkozásoknál (pl. csak template-ből vagy routerből hivatkozott komponensek) érdemes kézzel ellenőrizni.

### 6.9 Commit és Git hookok

`commitlint.config.mjs` (a gitlint alapértelmezett szabályainak megfelelője):

```js
export default {
  rules: {
    "header-max-length": [2, "always", 72],     // gitlint T1
    "header-full-stop": [2, "never", "."],      // gitlint T3
    "subject-empty": [2, "never"],              // gitlint T6
    "body-leading-blank": [2, "always"],        // gitlint B4 (üres sor a cím után)
    "body-max-line-length": [2, "always", 80],  // gitlint B1
    "body-empty": [2, "never"],                 // gitlint B6
    "body-min-length": [2, "always", 20],       // gitlint B5
  },
};
```

`.husky/pre-commit`:

```sh
npx lint-staged
```

`.husky/commit-msg`:

```sh
npx --no -- commitlint --edit "$1"
```

`.husky/pre-push` (Nx cache-sel, csak az érintett projektekre):

```sh
npx nx sync:check && npx nx affected -t lint typecheck test
```

### 6.10 Runtime validáció (Zod, a Pydantic megfelelője)

A TS típusok futásidőben eltűnnek. Ezért minden backendről érkező adatot a `data-access` rétegben Zod sémával validálunk. A `type:ui` libek a modulhatár-szabály miatt nem is importálhatják a `zod`-ot és a `HttpClient`-et.

```ts
// libs/playbook/data-access/src/lib/pattern-api.ts (példa)
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, type Observable } from "rxjs";
import { z } from "zod";

const patternSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: z.enum(["draft", "published"]),
});

export type Pattern = z.infer<typeof patternSchema>;

/** Playbook-minták lekérése a backendről. */
@Injectable({ providedIn: "root" })
export class PatternApi {
  private readonly http = inject(HttpClient);

  /** Visszaadja a validált mintalistát. */
  list(): Observable<Pattern[]> {
    return this.http.get<unknown>("/api/patterns").pipe(map((body) => z.array(patternSchema).parse(body)));
  }
}
```

> Ha a backend később OpenAPI specifikációt ad, a Zod sémák generálhatók belőle (pl. orval), így nem kell kézzel szinkronban tartani őket a Pydantic modellekkel.

### 6.11 E2E + accessibility (Playwright + axe)

```ts
// apps/playbook-e2e/src/a11y.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a főoldalon nincs WCAG 2.1 AA hiba", async ({ page }) => {
  await page.goto("/");
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations).toStrictEqual([]);
});
```

`apps/playbook-e2e/playwright.config.ts` (részlet). Ha a `webServer` egy Nx taskot indít és `reuseExistingServer: true`, az Nx a `serve` taskot függőségként futtatja, és az atomizált `e2e-ci` taskok egy szervert osztanak meg:

```ts
webServer: {
  command: "npx nx run playbook:serve",   // extra argumentum nélkül, különben az Nx nem ismeri fel
  url: "http://localhost:4200",
  reuseExistingServer: true,                      // a Playwright doksi !process.env.CI-t javasol, Nx-szel true kell
},
```

### 6.12 `package.json` (részlet)

```jsonc
{
  "engines": { "node": ">=26.0.0" },   // .nvmrc: 26; az Angular 22 / Nx 23 is támogatja
  "scripts": {
    "format": "nx format:write",
    "format:check": "nx format:check",
    "lint": "nx run-many -t lint",
    "lint:styles": "stylelint \"{apps,libs}/**/*.scss\"",
    "typecheck": "nx run-many -t typecheck",
    "test": "nx run-many -t test",
    "build": "nx run-many -t build",
    "e2e": "nx run-many -t e2e-ci",
    "spell": "cspell --no-progress \"**/*.{ts,html,scss,md,json}\"",
    "knip": "knip",
    "audit": "npm audit --audit-level=high",
    "quality": "nx sync:check && nx format:check && nx run-many -t lint typecheck test build && npm run lint:styles && npm run spell && npm run knip && npm run audit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,html}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.scss": ["stylelint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"],
    "*": ["cspell --no-must-find-files --no-progress"]
  }
}
```

`.npmrc`:

```
save-exact=true
engine-strict=true
```

`.nvmrc` (a `.python-version` megfelelője):

```
26
```

### 6.13 CI (`.github/workflows/ci.yml`)

Az Nx „Setting Up CI” mintája alapján (action-verziók a 2026-10-es doksiból), kiegészítve a baseline lépéseivel:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  actions: read
  contents: read

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0          # az nx affected-nek kell a git history
          filter: tree:0
      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - uses: nrwl/nx-set-shas@v5  # main-en: az utolsó zöld commit a base

      # Gyors, fail-fast ellenőrzések
      - run: npx nx sync:check
      - run: npx nx format:check

      # 1–3. réteg: lint (+ modulhatárok), típus, unit teszt, build (template-típusellenőrzés)
      - run: npx nx affected -t lint typecheck test build

      # 4. réteg: e2e + a11y (Atomizer: spec-fájlonkénti task, párhuzamosan)
      - run: npx playwright install --with-deps chromium
      - run: npx nx affected -t e2e-ci

      # Workspace-szintű eszközök (Nx-en kívül, cache nélkül)
      - run: npm run lint:styles
      - run: npm run spell
      - run: npm run knip
      - run: npm audit --audit-level=high

      - if: github.event_name == 'pull_request'
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD
```

> Nx Cloud szándékosan nincs (`neverConnectToCloud: true`). A cache ezért csak lokális: a CI minden futásnál nulláról indul, a gyorsítást az `nx affected` adja. Ha később a CI-idő indokolja, a GitHub Actions cache-sel a `.nx/cache` könyvtár menthető (az Nx Cloud nélküli, ingyenes köztes megoldás).

### 6.14 Saját ESLint-szabályok (a wemake-hiányok pótlása)

A wemake limitjei közül több nem létezik ESLint-szabályként. Az Nx `loadWorkspaceRules` segédfüggvénye egy workspace-könyvtárból tölt be TypeScriptben írt szabályokat, külön npm csomag nélkül. (Az `@nx/eslint:workspace-rule` generátor az Nx doksi szerint még nem támogatja az ESLint 9+-et, ezért kézzel hozzuk létre.)

`tools/eslint-rules/index.ts`:

```ts
import { maxMethods, RULE_NAME as maxMethodsName } from "./rules/max-methods";

export const rules = {
  [maxMethodsName]: maxMethods,
};
```

`tools/eslint-rules/rules/max-methods.ts` (wemake WPS214):

```ts
import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const RULE_NAME = "max-methods";

export const maxMethods = ESLintUtils.RuleCreator((name) => `tools/eslint-rules/rules/${name}.ts`)({
  name: RULE_NAME,
  meta: {
    type: "suggestion",
    docs: { description: "Limit the number of methods in a class (wemake WPS214)." },
    schema: [
      {
        type: "object",
        properties: { max: { type: "integer", minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooManyMethods: "Class has {{count}} methods, the maximum is {{max}}." },
  },
  defaultOptions: [{ max: 10 }],
  create(context, [{ max }]) {
    return {
      ClassBody(node: TSESTree.ClassBody): void {
        const count = node.body.filter(
          (member) => member.type === AST_NODE_TYPES.MethodDefinition && member.kind === "method",
        ).length;
        if (count > max) {
          context.report({ node, messageId: "tooManyMethods", data: { count, max } });
        }
      },
    };
  },
});
```

`tools/eslint-rules/tsconfig.json` (a `loadWorkspaceRules` ezt használja a transpiláláshoz):

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

**Következő szabályok ugyanezzel a mintával:**

| Szabály | wemake | AST-pont | Limit |
|---|---|---|---|
| `workspace/max-local-variables` | WPS210 | függvénytörzsenként a `VariableDeclarator`-ok száma | 10 |
| `workspace/max-try-body-length` | WPS229 | `TryStatement.block.body.length` | 2 |
| `workspace/max-import-from-members` | WPS235 | `ImportDeclaration.specifiers.length` | 15 |
| `workspace/max-module-members` | WPS202 | `Program.body` top-level deklarációi | 20 |

> Ellenőrizendő az első futásnál: a `loadWorkspaceRules` hiba esetén üres objektumot ad vissza és csak logol. Ilyenkor a `workspace/*` szabályokra „rule not found” hiba jön, vagyis a hiba nem marad csendben.

---

## 7. Ellenőrzési sorrend (gate-ek)

| Fázis | Mi fut | Python megfelelő |
|---|---|---|
| Szerkesztés közben (ember) | ESLint, Prettier, cspell IDE extension; Nx Console | ruff / mypy IDE integráció |
| Szerkesztés közben (AI agent) | Claude Code hookok: Pre/PostToolUse guard + fájlszintű lint, Stop: `nx affected` (15. fejezet) | – |
| `pre-commit` | lint-staged: ESLint `--fix`, Prettier, stylelint, cspell a módosított fájlokon | ruff + flake8 pre-commit |
| `commit-msg` | commitlint | gitlint |
| `pre-push` | `nx sync:check`, `nx affected -t lint typecheck test` (cache-elve) | mypy + pytest |
| CI | `sync:check`, `format:check`, `nx affected -t lint typecheck test build e2e-ci`, stylelint, cspell, knip, `npm audit`, commitlint | teljes lint + mypy + pytest |

---

## 8. Ismert hiányok a Python baseline-hoz képest

- **wemake-limitek:** a WPS214 saját szabállyal megvan (6.14). A WPS210, WPS229, WPS235 és WPS202 ugyanezzel a mintával megírandó. Egyedül a WPS221 (line complexity) marad ki.
- **Nincs szabályonkénti `unfixable`.** A CI fix nélkül futtatja az ESLintet.
- **Docstring-stílus:** a Google docstring helyett JSDoc/TSDoc (`@param`/`@returns`).
- **A template típusellenőrzés csak buildben fut**, ezért a `typecheck` mellett a `build` is kötelező gate.
- **A workspace-szintű eszközök (cspell, knip, stylelint, `npm audit`) Nx-en kívül futnak**, így nem kapnak cache-t és affected-szűrést. A futásidejük jellemzően kicsi.

---

## 9. Mérlegelt, de elvetett alternatívák

| Alternatíva | Miért nem (ebben a változatban) |
|---|---|
| **Sima Angular CLI, Nx nélkül** | nincs natív modulhatár, affected és cache. Ha mégis ez kell, lásd a 16. fejezetet. |
| **Bun** (runtime vagy csomagkezelő) | lásd 13. fejezet |
| **Nx Cloud** | döntés: nincs (külső SaaS, és ebben a méretben nem indokolt) |
| **dependency-cruiser** | Nx mellett redundáns: az `@nx/enforce-module-boundaries` tagekkel, `bannedExternalImports`-szal és körkörösség-ellenőrzéssel fedi. Csak projekten belüli (mappa-szintű) rétegszabályokhoz érdemes. |
| **Oxlint / oxfmt** (az Nx 23 már felkínálja: `--linter=oxlint`, `--formatter=oxfmt`) | gyors, de nincs angular-eslint szintű template- és a11y-lint; a modulhatár-szabály Oxlinten az Nx doksi szerint még kísérleti |
| **Biome** | ugyanaz: nincs Angular template-támogatás és plugin-ökoszisztéma |
| **typescript-eslint `all`** | maga a typescript-eslint sem ajánlja éles használatra (egymásnak ellentmondó szabályok) |
| **Jest** | Angular 21+ esetén az Nx is a Vitestet (`vitest-angular`) generálja alapból |
| **Cypress** | a Playwright az Nx alapértelmezett e2e-futtatója, és az axe-integrációja egyszerű |
| **`no-warning-comments` a flake8-eradicate helyett** | TODO/FIXME-t jelez, nem kikommentezett kódot; a helyes megfelelő a `sonarjs/no-commented-code` |

---

## 10. Döntési pontok

**Eldöntve:** a repó a `Gen-AI-Architect-Playbook` (Nx a gyökérben); nincs Nx Cloud; Node 26, nvm + `.nvmrc`; npm; SCSS + stylelint; külön `.ts` / `.html` / `.scss` fájlok.

1. **Selector prefix:** `pb` (javasolt) vagy a teljes `playbook` (5. fejezet). Később minden komponenst érint.
2. **`tsAll` / `templateAll` vagy az Nx-alapértelmezés (`tsRecommended` + `templateRecommended` + a11y):** az „ALL” a ruff-filozófiát követi, de `nx migrate` után új szabályok jöhetnek be. A ruff `ALL` ugyanígy viselkedik verzióemeléskor. Javaslat: `*All`, indokolt ignore listával. Konzervatívabb út: `eslint.angular.mjs`-ből a két `extends` sor törlése.
3. **Idézőjel-stílus:** `singleQuote: true` (Angular- és Nx-konvenció) vagy `false` (a Python `inline-quotes=double` párja). Javaslat: single.
4. **`exactOptionalPropertyTypes`:** nagyon szigorú, egyes harmadik féltől származó típusokkal súrlódhat. Javaslat: bekapcsolva indulni.
5. **`@typescript-eslint/strict-boolean-expressions`:** a legszigorúbb truthiness-szabály. Javaslat: opcionális.
6. **`no-console`:** teljes tiltás (flake8-print párja), vagy `allow: ["warn", "error"]` (frontend-logolás). Javaslat: teljes tiltás, és egy saját logger service a `util` libben.
7. **Helyesírás a lint taskban:** a cspell `@cspell/eslint-plugin`-nal az ESLintbe költöztethető, így cache-t és affected-szűrést kap (12. fejezet). Javaslat: maradjon CLI, amíg a futásideje nem zavaró.
8. **Zod vagy Valibot:** a Valibot kisebb bundle-t ad, a Zod elterjedtebb. Javaslat: Zod.
9. **i18n:** ha `@angular/localize` lesz, a `template/i18n`, `require-localize-metadata` és `runtime-localize` szabályokat vissza kell kapcsolni.
10. **Commit formátum:** gitlint-ekvivalens szabályok, vagy `@commitlint/config-conventional` (ez utóbbi az `nx release`-szel is jól működik).
11. **Lefedettségi küszöb:** a Python repóban nincs. Vitest `coverage.thresholds`-szal projektenként beállítható.
12. **Márkaszínek és betűpár:** a 6.8c értékei csak példák. A végleges alapszíneket és fontokat egyszer kell kiválasztani; a csere egy schematic-futtatás és a `theme.scss` két sora.
13. **Sötét mód:** `color-scheme: light dark` (a rendszerbeállítás szerint) vagy csak világos (`light`).

---

## 11. Összevetés a „B” javaslattal: mi került be, mi nem

| B javaslata | Státusz v2-ben | Indoklás |
|---|---|---|
| Zod runtime validáció | ✅ átvéve (6.10) | a Pydantic valódi párja; a modulhatár csak a data-access rétegben engedi |
| `npm audit` a CI-ban | ✅ átvéve | |
| Architektúra mint külön réteg | ✅ átvéve (1., 5. fejezet) | |
| dependency-cruiser | 🔄 lecserélve: `@nx/enforce-module-boundaries` | Nx mellett redundáns lenne |
| axe + Playwright e2e | ✅ átvéve (6.11) | |
| `ng add angular-eslint --tseslint-preset=strictTypeChecked` | 🔄 a 16. fejezetbe (Nx nélküli út) | Nx alatt a root config adja ugyanezt |
| „ne `*All`, hanem recommended” | 🔄 döntési pont (10/2) | jogos óvatosság, de a ruff `ALL`-lal konzisztens a `*All` |
| `no-warning-comments` (eradicate) | ❌ elvetve | hibás megfeleltetés |
| `max-params: 4`, `cognitive-complexity: 15` | ❌ elvetve | a wemake alapértékei 5 és 12 |
| `no-console` `warn`/`error` engedése | 🔄 döntési pont (10/6) | |
| `noUnusedLocals` / `noUnusedParameters` | ❌ elvetve | duplikálja az ESLintet, és ütközik a `_` prefix-konvencióval |

---

## 12. Nx-kihasználtság a lint/teszt témakörben

| Nx képesség | Állapot | Megjegyzés |
|---|---|---|
| Inferred lint task (`@nx/eslint/plugin`) + lokális cache | ✅ | |
| `nx affected` (CI és pre-push) | ✅ | |
| `@nx/enforce-module-boundaries` (scope/type tagek, `bannedExternalImports`, `banTransitiveDependencies`) | ✅ | tag nélküli projekt nem függhet semmitől, ezért a tagelés kikényszerített |
| `nx sync:check`, `nx format:check` | ✅ | |
| Generátorok tagekkel, `nx migrate` | ✅ | |
| Saját workspace ESLint-szabályok (`loadWorkspaceRules`) | ✅ v3 (6.14) | a wemake-hiányok pótlása |
| `namedInputs` / precíz cache-inputok | ✅ v3 (6.1) | a teszt- vagy lint-változás nem invalidálja a build cache-t |
| Playwright Atomizer (`e2e-ci`) | ✅ v3 | Cloud nélkül is hasznos: spec-fájlonkénti cache és párhuzamos futás |
| Workspace-szintű eszközök Nx-taskként (cspell, stylelint) | ⏳ opcionális | cspell: `@cspell/eslint-plugin` a lint taskban; stylelint: saját inference plugin (`@nx/plugin`) |
| Saját generátor (kötelező `scope`/`type`, egységes lib-beállítások) | ⏳ opcionális | `@nx/plugin:generator`; kényelmi funkció, a tagelést a modulhatár-szabály amúgy is kikényszeríti |
| `nx configure-ai-agents` / Nx MCP | ✅ (14. fejezet) | az AI-agentek (pl. Claude Code) megkapják a projektgráfot és a generátorokat |
| `@nx/dependency-checks` | ➖ nem releváns | csak buildable/publishable libekhez kell |
| Remote cache, Nx Agents, flaky-task retry, self-healing CI | ❌ döntés szerint nincs | Nx Cloud kell hozzá |
| Conformance, Owners | ❌ nem elérhető | Nx Enterprise licenc kell hozzá |

**Összegzés:** a v3-mal a Cloud és Enterprise nélkül elérhető lint/teszt képességek érdemi része be van kötve. A három ⏳ tétel kényelmi vagy gyorsítási lépés, a szigorúságon nem változtat.

---

## 13. Node-verzió és csomagkezelő

**Node-verzió:** az Angular 22 (`@angular/cli`, `@angular/build`) és az Nx 23 engines mezője `^22.22.3 || ^24.15.0 || >=26.0.0` (npm, 2026-10-17). **Döntés: Node 26** (`.nvmrc`: `26`). A Node.js release schedule szerint a 26 2026-10-28-án lesz LTS, és 2029-04-30-ig támogatott. A 24-es ág 2026-10-20-tól csak biztonsági javításokat kap, és 2028-04-30-án ér véget. Így a projekt egy Node-váltással kevesebbet igényel. Kockázat: az `engine-strict=true` miatt az `npm install` hibát ad, ha egy függőség `engines` mezője még nem engedi a 26-ot; ilyenkor a visszalépés a `.nvmrc` → `24`.

**Verziókezelő: nvm, megfelelő.** A `.nvmrc` a szerződés: az nvm, az fnm, a mise, a Volta és a GitHub `setup-node` (`node-version-file`) is olvassa, így a választott eszköz cserélhető. Az `.npmrc` `engine-strict=true` beállítása miatt rossz Node-verzióval az `npm install` hibát ad. Ha az nvm lassú shell-indulása zavar, az **fnm** egy gyorsabb, drop-in csere ugyanazzal a `.nvmrc`-vel (`fnm env --use-on-cd`).

**Bun: nem.** A kérdés két dolgot kever, mert a Bun nem verziókezelő, hanem runtime és csomagkezelő:

| Bun mint… | Értékelés |
|---|---|
| **Runtime** | Az Angular CLI és az Nx engines mezője Node-ot ír elő; Bun runtime-mal a build tooling nem támogatott. A Node mindenképp kell. |
| **Csomagkezelő** | Az Angular CLI és az Nx támogatja, és gyorsabb az install. Viszont: plusz eszköz a Node mellé, `npm audit` helyett `bun audit`, `bun.lock`, és a doksik, példák (Nx, Angular, Playwright) npm-alapúak. CI-cache mellett az install-idő nem szűk keresztmetszet. |

**Csomagkezelő: npm.** Ha később gyorsabb install vagy szigorúbb függőség-izoláció kell, a **pnpm** a jobb következő lépés: a nem deklarált (phantom) függőségeket fizikailag sem engedi importálni, ami illik a `banTransitiveDependencies` szigorához.

---

## 14. AI-agent integráció (MCP szerverek)

A workspace létrehozása után kell beállítani. A projekt-szintű `.mcp.json` commitolva van, így mindenki ugyanazt kapja; a Claude Code az első használatkor jóváhagyást kér hozzá.

| Integráció | Javaslat | Mire jó | Megjegyzés |
|---|---|---|---|
| **Nx: `npx nx configure-ai-agents --agents claude`** | ✅ igen | `CLAUDE.md`/`AGENTS.md` szabályok, Nx agent skillek (Claude Code pluginként: workspace-feltérképezés, generátorok, task-futtatás), Nx MCP | Az Nx doksi szerint a fő értéket a skillek adják. Az Nx MCP ma főleg Nx Cloud CI-hoz és a friss Nx doksihoz kell; Cloud nélkül csak az utóbbi. |
| **Angular CLI MCP (`ng mcp --read-only`)** | ✅ igen | Angular best practices, dokumentáció-keresés, AI tutor, zoneless/OnPush migrációs segéd | A workspace-eszközei (projektlista, target-futtatás, devserver) `angular.json`-t keresnek. Nx-ben (`project.json`) ezek nem működnek; ezt a részt az Nx skillek adják. |
| **Playwright MCP (`@playwright/mcp`)** | ✅ igen | a futó app böngészős kipróbálása accessibility-snapshot alapján, UI-hibák reprodukálása, e2e tesztek írásának támogatása | WSL2-ben `--headless`; verzió pinelve. |
| Chrome DevTools MCP (`chrome-devtools-mcp`) | ⏳ opcionális | teljesítmény-trace, konzol, hálózat, Core Web Vitals | a Playwrightot kiegészíti, nem helyettesíti; akkor kell, ha teljesítményt debugolsz |
| Context7 | ⏳ opcionális | friss lib-doksik (Zod, Vitest, typescript-eslint) | claude.ai connectorként már elérhető, hitelesítés kell |
| Figma | ⏳ ha lesz design | design → komponens | claude.ai connectorként elérhető |
| ESLint MCP (`@eslint/mcp`) | ❌ nem | – | az agent `nx lint`-et futtat, és a cache-elt Nx task jobb |
| GitHub MCP | ❌ nem | – | a `gh` CLI lefedi |

`.mcp.json` (a repó gyökerében):

```json
{
  "mcpServers": {
    "nx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["nx", "mcp"]
    },
    "angular-cli": {
      "type": "stdio",
      "command": "npx",
      "args": ["ng", "mcp", "--read-only"]
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@0.0.83", "--headless"]
    }
  }
}
```

> Az `nx-mcp` bejegyzést a `configure-ai-agents` is megírja; ellenőrizd, hogy nincs duplikálva. Az `npx nx` és az `npx ng` a lokálisan telepített, `package-lock.json`-ban rögzített verziót futtatja. A Playwright MCP-t a fenti módon kell pinelni, mert nem projekt-függőség. A Playwright MCP az agentnek böngésző-hozzáférést ad; csak a lokális dev szerverhez (`http://localhost:4200`) használd, ne bejelentkezett külső oldalakhoz.

---

## 15. AI tooling (Claude Code): hookok, jogosultságok, szabályok

**Elv:** az agent ugyanazokon a kapukon megy át, mint az ember, csak korábban és gyorsabban kap visszajelzést. A Claude Code hookok **nem helyettesítik** a git hookokat és a CI-t, hanem eléjük kerülnek. Két dolgot tesznek: azonnali lint-visszajelzést adnak, és megakadályozzák az agentek tipikus hibáját, a minőségi kapuk gyengítését (szabály kikapcsolása, `--no-verify`, config lazítása).

| Szint | Mikor fut | Mi fut | Időigény |
|---|---|---|---|
| **PreToolUse** (`Edit`/`Write`) | minden fájlmódosítás előtt | védett konfigok → emberi jóváhagyás; új `eslint-disable` / `@ts-ignore` / `.only` → tiltás; lockfile → tiltás | ms |
| **PreToolUse** (`Bash`) | minden shell-parancs előtt | `--no-verify`, `HUSKY=0`, force push, Nx Cloud, `npm publish` → tiltás; `nx migrate` / `npm update` → jóváhagyás | ms |
| **PostToolUse** (`Edit`/`Write`) | minden fájlmódosítás után | Prettier, `eslint --fix`, stylelint, cspell az adott fájlra; a maradék hibák visszamennek az agentnek | 1–5 s (a type-aware ESLint indulása) |
| **Stop** | mielőtt az agent befejezi | `nx affected -t lint typecheck test` a változott fájlok alapján; ha elbukik, az agent javít | 10 s – pár perc (cache-elve) |
| **SessionStart** | session indulásakor | Node-verzió vs `.nvmrc` ellenőrzése | ms |
| git `pre-commit` / `commit-msg` / `pre-push` | commit és push | lint-staged, commitlint, `nx affected` (6.9) | mp |
| CI | PR | teljes kapu (6.13) | perc |

**Fájlok:**

```
.claude/
├── settings.json            jogosultságok + hookok (commitolva, védett)
├── hooks/
│   ├── guard-edit.mjs       PreToolUse: Edit|Write|MultiEdit
│   ├── guard-bash.mjs       PreToolUse: Bash
│   ├── lint-file.mjs        PostToolUse: Edit|Write|MultiEdit
│   ├── quality-gate.mjs     Stop
│   └── session-start.mjs    SessionStart
└── skills/
    └── new-lib/SKILL.md     lib-generálás névkonvencióval és tagekkel
CLAUDE.md                    projektszabályok (az nx configure-ai-agents által generált rész + saját)
.mcp.json                    MCP szerverek (14. fejezet)
```

> A hookok Node-scriptek (`.mjs`): a Node úgyis kell, nincs plusz függőség, és WSL-ben is működnek. A scriptek bemenete a stdin-en érkező JSON (`tool_name`, `tool_input`, `stop_hook_active` stb.).

### 15.1 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(npx nx:*)",
      "Bash(npm run:*)",
      "Bash(npm ci)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "mcp__nx-mcp",
      "mcp__angular-cli",
      "mcp__playwright"
    ],
    "ask": [
      "Bash(npm install:*)",
      "Bash(npm i:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(npm publish:*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.mjs" }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-edit.mjs", "timeout": 10 }]
      },
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-bash.mjs", "timeout": 10 }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint-file.mjs", "timeout": 120 }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/quality-gate.mjs", "timeout": 900 }]
      }
    ]
  }
}
```

### 15.2 `.claude/hooks/guard-edit.mjs` (PreToolUse)

```js
// PreToolUse (Edit|Write|MultiEdit): az agent ne gyengíthesse a minőségi kapukat
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const toolInput = input.tool_input ?? {};
const rawPath = toolInput.file_path ?? "";
const absPath = isAbsolute(rawPath) ? rawPath : join(root, rawPath);
const file = relative(root, absPath).replaceAll("\\", "/");

function decide(permissionDecision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision, permissionDecisionReason: reason },
  }));
  process.exit(0);
}

if (file === "package-lock.json") {
  decide("deny", "A package-lock.json-t csak az npm írhatja (npm install / npm ci).");
}

const PROTECTED = [
  /(^|\/)eslint\.(config|angular)\.mjs$/,
  /(^|\/)tsconfig[\w.]*\.json$/,
  /(^|\/)project\.json$/,
  /^nx\.json$/,
  /^\.prettierrc/,
  /^\.stylelintrc/,
  /^cspell\.json$/,
  /^knip\.json$/,
  /^commitlint\.config\.mjs$/,
  /^\.npmrc$/,
  /^\.husky\//,
  /^tools\/eslint-rules\//,
  /^libs\/shared\/theme\//,
  /^\.claude\/(settings\.json|hooks\/)/,
  /^\.github\/workflows\//,
];
if (PROTECTED.some((pattern) => pattern.test(file))) {
  decide("ask", `${file} minőségi konfiguráció: a módosításhoz emberi jóváhagyás kell.`);
}

// új elnyomás nem kerülhet be; a már meglévőt tartalmazó szerkesztés nem akad el
const SUPPRESSION = /eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error|\b(?:describe|it|test)\.only\(/g;
const count = (text) => (text ?? "").match(SUPPRESSION)?.length ?? 0;
const changes = input.tool_name === "Write"
  ? [{ before: existsSync(absPath) ? readFileSync(absPath, "utf8") : "", after: toolInput.content }]
  : (toolInput.edits ?? [toolInput]).map((edit) => ({ before: edit.old_string, after: edit.new_string }));
const added = changes.reduce((sum, { before, after }) => sum + count(after) - count(before), 0);
if (added > 0) {
  decide("deny", "Lint- vagy típus-elnyomás, illetve fókuszált teszt (.only) nem adható hozzá. "
    + "Javítsd a kódot; ha a szabály szerinted hibás, kérdezd meg a felhasználót.");
}
```

### 15.3 `.claude/hooks/guard-bash.mjs` (PreToolUse)

```js
// PreToolUse (Bash): a git hookok és a rögzített döntések megkerülésének tiltása
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
// idézőjeles részek (pl. commit üzenet) nélkül, hogy a szövegben lévő "-n" ne okozzon hamis riasztást
const command = (input.tool_input?.command ?? "").replaceAll(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""');

const RULES = [
  { pattern: /--no-verify\b|\bgit\s+commit\b.*\s-n\b|\bHUSKY=0\b/, decision: "deny", reason: "A git hookok megkerülése tilos." },
  { pattern: /\bgit\s+push\b.*\s(--force(-with-lease)?|-f)\b/, decision: "deny", reason: "Force push tilos." },
  { pattern: /\bnx\s+connect\b|\bnx-cloud\b/, decision: "deny", reason: "Nx Cloud nincs használatban (neverConnectToCloud)." },
  { pattern: /\bnpm\s+publish\b/, decision: "deny", reason: "A publikálás nem az agent feladata." },
  { pattern: /\bnx\s+migrate\b|\bnpm\s+(update|up|audit\s+fix)\b/, decision: "ask", reason: "Függőségfrissítés: emberi jóváhagyás kell." },
];

const hit = RULES.find(({ pattern }) => pattern.test(command));
if (hit) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: hit.decision, permissionDecisionReason: hit.reason },
  }));
}
```

### 15.4 `.claude/hooks/lint-file.mjs` (PostToolUse)

```js
// PostToolUse (Edit|Write|MultiEdit): formázás, autofix, és a maradék hibák visszajelzése az agentnek
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const file = input.tool_input?.file_path ?? "";
if (!/\.(ts|mjs|html|scss|json|md)$/.test(file) || /node_modules|package-lock\.json/.test(file)) {
  process.exit(0);
}

function run(tool, args) {
  try {
    execFileSync(join(root, "node_modules", ".bin", tool), args, { cwd: root, encoding: "utf8", stdio: "pipe" });
    return "";
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
  }
}

const problems = [
  run("prettier", ["--write", "--log-level=warn", file]),
  /\.(ts|html)$/.test(file) ? run("eslint", ["--fix", "--max-warnings=0", file]) : "",
  /\.scss$/.test(file) ? run("stylelint", ["--fix", file]) : "",
  run("cspell", ["--no-progress", "--no-summary", file]),
].filter(Boolean);

// exit 2: a stderr visszamegy az agentnek, aki azonnal javít
if (problems.length > 0) {
  process.stderr.write(`Hibák a(z) ${relative(root, file)} fájlban, javítsd őket:\n${problems.join("\n")}\n`);
  process.exit(2);
}
```

> A Prettier és az `eslint --fix` a szerkesztés után átírhatja a fájlt. A Claude Code ezt észleli, és a következő szerkesztés előtt a friss tartalommal dolgozik.

### 15.5 `.claude/hooks/quality-gate.mjs` (Stop)

```js
// Stop: mielőtt az agent befejezi, az érintett projekteken lefut a lint, a typecheck és a unit teszt
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
if (input.stop_hook_active) {
  process.exit(0);  // egy javítási kör után engedjük megállni, különben végtelen ciklus lehet
}

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const changedFiles = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter((line) => line && !/^( D|D )/.test(line))
  .map((line) => line.slice(3).split(" -> ").at(-1));
if (changedFiles.length === 0) {
  process.exit(0);
}

try {
  execFileSync(
    join(root, "node_modules", ".bin", "nx"),
    ["affected", "-t", "lint", "typecheck", "test", `--files=${changedFiles.join(",")}`, "--output-style=static"],
    { cwd: root, encoding: "utf8", stdio: "pipe", maxBuffer: 64 * 1024 * 1024 },
  );
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.split("\n").slice(-150).join("\n");
  process.stderr.write(`A minőségi kapu (nx affected -t lint typecheck test) elbukott. Javítsd, mielőtt befejezed:\n${output}\n`);
  process.exit(2);
}
```

### 15.6 `.claude/hooks/session-start.mjs` (SessionStart)

```js
// SessionStart: Node-verzió ellenőrzése; a kimenet a session kontextusába kerül
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const wanted = readFileSync(join(root, ".nvmrc"), "utf8").trim();
const actual = process.versions.node.split(".")[0];
if (actual !== wanted) {
  process.stdout.write(`FIGYELEM: Node ${process.versions.node} fut, a .nvmrc szerint ${wanted} kell. `
    + "Kérd meg a felhasználót, hogy futtassa: nvm use\n");
}
```

### 15.7 `CLAUDE.md` (saját rész, az `nx configure-ai-agents` által generált blokk mellé)

```md
# Gen-AI-Architect-Playbook

Angular + Nx monorepo. A minőségi baseline: `angular-quality-baseline.md`.

## Parancsok
- Mindent Nx-en keresztül futtass (cache + affected): `npx nx affected -t lint typecheck test`, `npx nx run <projekt>:<target>`.
- Új lib csak a `/new-lib` skill-lel (névkonvenció és tagek kötelezők).

## Szabályok
- Lint-, típus- vagy teszt-szabályt ne kapcsolj ki és ne lazíts (`eslint-disable`, `@ts-ignore`, `.only`, config-módosítás). Ha egy szabály szerinted hibás, kérdezz.
- Modulhatárok: `feature` → `ui` / `data-access` / `util`; a `ui` nem használ HttpClient-et és Zod-ot; backend-adat csak Zod-validálva, a `data-access` libben.
- Nevek: import `@playbook/<lib>`, selector prefix `pb`, kebab-case fájlnevek.
- Nincs Nx Cloud, nincs `--no-verify`.

## Design (Angular Material 3)
- Szín, tipográfia, sarok, árnyék csak tokenből: `--mat-sys-*` és `--pb-*`. A téma egyetlen forrása `libs/shared/theme/`; ne módosítsd kérés nélkül.
- Előbb Material komponens; saját csak ha nincs megfelelő.
- Visszafogott színhasználat: felületek neutral (`surface*`), `primary` csak fő akciókhoz, `tertiary` ritkán.
- Nincs gradient, glow, dekoratív árnyék, emoji ikonként (Material Symbols), és nincs „hero” díszítés kérés nélkül.
- Kész UI-t a Playwright MCP-vel nézd meg világos és sötét módban, mielőtt késznek jelented.

## Hookok
- Szerkesztés után a hook formáz, autofixel, és visszaadja a maradék lint- és helyesírási hibákat: ezeket azonnal javítsd.
- Befejezés előtt a Stop hook lefuttatja az érintett lint-, typecheck- és teszt-taskokat.
```

### 15.8 `.claude/skills/new-lib/SKILL.md`

```md
---
name: new-lib
description: Új Nx Angular lib létrehozása a workspace névkonvenciójával és kötelező scope/type tagekkel. Használd, amikor új feature-, ui-, data-access- vagy util-lib kell.
---

1. Tisztázd (ha nem egyértelmű): scope (`playbook` | `shared`), type (`feature` | `ui` | `data-access` | `util`), név (kebab-case).
2. Generálás:
   - playbook scope: `npx nx g @nx/angular:lib libs/playbook/<név> --name=playbook-<név> --importPath=@playbook/<név> --prefix=pb --tags=scope:playbook,type:<type> --unitTestRunner=vitest-angular`
   - shared scope: `npx nx g @nx/angular:lib libs/shared/<név> --name=shared-<név> --importPath=@playbook/shared-<név> --prefix=pb --tags=scope:shared,type:<type> --unitTestRunner=vitest-angular`
3. A lib `eslint.config.mjs`-e a baseline 6.5 mintája szerint (root + `eslint.angular.mjs` + selector-szabályok + prettier).
4. Ellenőrzés: `npx nx lint <projekt>` és `npx nx test <projekt>`.
```

**Beépített Claude Code eszközök, amiket érdemes használni:** `/code-review` (diff-review a PR előtt) és `/security-review`.

> **Ellenőrizendő az első futásnál:**
> - a Stop hook futásideje (ha túl lassú, a `test` kivehető belőle, és a pre-push / CI viszi);
> - hogy a PostToolUse type-aware ESLint 1–5 másodperce elfogadható-e szerkesztésenként.
>
> A hook-scriptek maguk is védett fájlok, így az agent sem tudja őket csendben kikapcsolni.

---

## 16. Függelék: ugyanez Nx nélkül (sima Angular CLI)

Ha az Nx overheadjét nem vállalod:

```bash
ng new playbook --strict --style=scss
cd playbook
ng add angular-eslint --tseslint-preset=strictTypeChecked
```

Különbségek az Nx-es változathoz képest:

- **Egy** `eslint.config.mjs`: a 6.3 és a 6.4 összefésülve, az `@nx/*` részek nélkül.
- **Architektúra:** `@nx/enforce-module-boundaries` helyett dependency-cruiser (`npx depcruise --init`), mappa-alapú rétegszabályokkal (`feature` → `ui`/`data-access`/`util`, `ui` ↛ `HttpClient`).
- **Parancsok:** `nx affected -t …` helyett `ng lint`, `ng test --no-watch`, `ng build --configuration production`, `tsc --noEmit`; nincs cache és affected-szűrés.
- **Formázás:** `nx format:check` helyett `prettier --check .`
