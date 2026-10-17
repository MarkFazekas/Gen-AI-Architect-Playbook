// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

export const RULE_NAME = 'max-import-from-members';

// Equivalent of wemake WPS235 (max-import-from-members): too many names from one module hints at a missing abstraction.
export const maxImportFromMembers = ESLintUtils.RuleCreator((name) => `tools/lint-rules/rules/${name}.mjs`)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of names imported from one module (wemake WPS235).' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooManyMembers: '{{count}} names are imported from one module, the maximum is {{max}}.' },
  },
  defaultOptions: [{ max: 15 }],
  create(context, [{ max }]) {
    return {
      ImportDeclaration(node) {
        const count = node.specifiers.filter((specifier) => specifier.type === AST_NODE_TYPES.ImportSpecifier).length;
        if (count > max) {
          context.report({ node, messageId: 'tooManyMembers', data: { count, max } });
        }
      },
    };
  },
});
