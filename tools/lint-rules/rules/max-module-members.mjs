// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

export const RULE_NAME = 'max-module-members';

const FUNCTION_TYPES = new Set([AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression]);

/**
 * Tells whether a top-level statement declares a function or a class.
 * @param {import('@typescript-eslint/utils').TSESTree.Node | null | undefined} statement A top-level statement.
 * @returns {boolean} True for functions and classes, including exported ones and `const f = () => …`.
 */
function isMember(statement) {
  if (!statement) {
    return false;
  }
  if (
    statement.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    statement.type === AST_NODE_TYPES.ExportDefaultDeclaration
  ) {
    return isMember(statement.declaration);
  }
  if (statement.type === AST_NODE_TYPES.FunctionDeclaration || statement.type === AST_NODE_TYPES.ClassDeclaration) {
    return true;
  }
  return (
    statement.type === AST_NODE_TYPES.VariableDeclaration &&
    statement.declarations.some((declarator) => declarator.init && FUNCTION_TYPES.has(declarator.init.type))
  );
}

// Equivalent of wemake WPS202 (max-module-members): functions and classes defined at module level.
export const maxModuleMembers = ESLintUtils.RuleCreator((name) => `tools/lint-rules/rules/${name}.mjs`)({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the number of functions and classes in a module (wemake WPS202).' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: { tooManyMembers: 'Module defines {{count}} functions and classes, the maximum is {{max}}.' },
  },
  defaultOptions: [{ max: 20 }],
  create(context, [{ max }]) {
    return {
      Program(node) {
        const count = node.body.filter((statement) => isMember(statement)).length;
        if (count > max) {
          context.report({ node, messageId: 'tooManyMembers', data: { count, max } });
        }
      },
    };
  },
});
