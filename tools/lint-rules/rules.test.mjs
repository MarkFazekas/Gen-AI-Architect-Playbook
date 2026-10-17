// Tests for the custom lint rules: node --test tools/lint-rules
import { describe, it } from 'node:test';

import { RuleTester } from 'eslint';

import { rules } from './index.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } });

const methods = (count) => `class A { ${Array.from({ length: count }, (_, index) => `m${index}() {}`).join(' ')} }`;
const locals = (count) =>
  `function f() { ${Array.from({ length: count }, (_, index) => `const v${index} = ${index};`).join(' ')} }`;
const names = (count) => `import { ${Array.from({ length: count }, (_, index) => `n${index}`).join(', ')} } from 'x';`;
const members = (count) => Array.from({ length: count }, (_, index) => `function f${index}() {}`).join('\n');

tester.run('max-methods', rules['max-methods'], {
  valid: [{ code: methods(2), options: [{ max: 2 }] }, 'class A { get x() { return 1; } constructor() {} }'],
  invalid: [{ code: methods(3), options: [{ max: 2 }], errors: [{ messageId: 'tooManyMethods' }] }],
});

tester.run('max-local-variables', rules['max-local-variables'], {
  valid: [
    { code: locals(2), options: [{ max: 2 }] },
    // nested functions have their own budget; parameters do not count
    {
      code: 'function f(a, b, c) { const x = 1; const g = () => { const y = 2; const z = 3; }; }',
      options: [{ max: 2 }],
    },
  ],
  invalid: [
    { code: locals(3), options: [{ max: 2 }], errors: [{ messageId: 'tooManyVariables' }] },
    { code: 'function f() { const a = 1; if (a) { const b = 2; const c = 3; } }', options: [{ max: 2 }], errors: 1 },
  ],
});

tester.run('max-try-body-length', rules['max-try-body-length'], {
  valid: ['try { a(); b(); } catch {}'],
  invalid: [{ code: 'try { a(); b(); c(); } catch {}', errors: [{ messageId: 'tooLong' }] }],
});

tester.run('max-import-from-members', rules['max-import-from-members'], {
  valid: [
    { code: names(3), options: [{ max: 3 }] },
    { code: "import x, * as y from 'x';", options: [{ max: 1 }] },
  ],
  invalid: [{ code: names(4), options: [{ max: 3 }], errors: [{ messageId: 'tooManyMembers' }] }],
});

tester.run('max-module-members', rules['max-module-members'], {
  valid: [
    { code: members(2), options: [{ max: 2 }] },
    { code: 'export const value = 1;\nexport const f = () => 1;\nclass A {}', options: [{ max: 2 }] },
  ],
  invalid: [
    { code: members(3), options: [{ max: 2 }], errors: [{ messageId: 'tooManyMembers' }] },
    { code: 'export function f() {}\nexport class A {}\nexport const g = () => 1;', options: [{ max: 2 }], errors: 1 },
  ],
});
