// @ts-check
import { ESLintUtils } from '@typescript-eslint/utils';

export const RULE_NAME = 'max-local-variables';

// Equivalent of wemake WPS210 (max-local-variables): variables declared in a function body,
// including nested blocks but not nested functions. Parameters do not count.
export const maxLocalVariables = ESLintUtils.RuleCreator((name) => `tools/lint-rules/rules/${name}.mjs`)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of local variables in a function (wemake WPS210).' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooManyVariables: 'Function has {{count}} local variables, the maximum is {{max}}.' },
  },
  defaultOptions: [{ max: 10 }],
  create(context, [{ max }]) {
    /** @type {Set<string>[]} */
    const stack = [];
    const enter = () => {
      stack.push(new Set());
    };
    /** @param {import('@typescript-eslint/utils').TSESTree.Node} node */
    const exit = (node) => {
      const names = stack.pop() ?? new Set();
      if (names.size > max) {
        context.report({ node, messageId: 'tooManyVariables', data: { count: names.size, max } });
      }
    };
    return {
      FunctionDeclaration: enter,
      FunctionExpression: enter,
      ArrowFunctionExpression: enter,
      'FunctionDeclaration:exit': exit,
      'FunctionExpression:exit': exit,
      'ArrowFunctionExpression:exit': exit,
      VariableDeclarator(node) {
        const current = stack.at(-1);
        if (current) {
          for (const variable of context.sourceCode.getDeclaredVariables(node)) {
            current.add(variable.name);
          }
        }
      },
    };
  },
});
