// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

export const RULE_NAME = 'max-methods';

// Equivalent of wemake WPS214 (max-methods).
export const maxMethods = ESLintUtils.RuleCreator((name) => `tools/lint-rules/rules/${name}.mjs`)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of methods in a class (wemake WPS214).' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooManyMethods: 'Class has {{count}} methods, the maximum is {{max}}.' },
  },
  defaultOptions: [{ max: 10 }],
  create(context, [{ max }]) {
    return {
      ClassBody(node) {
        const count = node.body.filter(
          (member) => member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'method',
        ).length;
        if (count > max) {
          context.report({ node, messageId: 'tooManyMethods', data: { count, max } });
        }
      },
    };
  },
});
