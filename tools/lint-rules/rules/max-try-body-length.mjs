// @ts-check
import { ESLintUtils } from '@typescript-eslint/utils';

export const RULE_NAME = 'max-try-body-length';

// Equivalent of wemake WPS229 (max-try-body-length): keep `try` blocks focused on the call that can fail.
export const maxTryBodyLength = ESLintUtils.RuleCreator((name) => `tools/lint-rules/rules/${name}.mjs`)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of statements in a try block (wemake WPS229).' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooLong: 'try block has {{count}} statements, the maximum is {{max}}.' },
  },
  defaultOptions: [{ max: 2 }],
  create(context, [{ max }]) {
    return {
      TryStatement(node) {
        const count = node.block.body.length;
        if (count > max) {
          context.report({ node: node.block, messageId: 'tooLong', data: { count, max } });
        }
      },
    };
  },
});
