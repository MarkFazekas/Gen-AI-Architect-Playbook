// @ts-check
import { maxImportFromMembers, RULE_NAME as maxImportFromMembersName } from './rules/max-import-from-members.mjs';
import { maxLocalVariables, RULE_NAME as maxLocalVariablesName } from './rules/max-local-variables.mjs';
import { maxMethods, RULE_NAME as maxMethodsName } from './rules/max-methods.mjs';
import { maxModuleMembers, RULE_NAME as maxModuleMembersName } from './rules/max-module-members.mjs';
import { maxTryBodyLength, RULE_NAME as maxTryBodyLengthName } from './rules/max-try-body-length.mjs';

export const rules = {
  [maxImportFromMembersName]: maxImportFromMembers,
  [maxLocalVariablesName]: maxLocalVariables,
  [maxMethodsName]: maxMethods,
  [maxModuleMembersName]: maxModuleMembers,
  [maxTryBodyLengthName]: maxTryBodyLength,
};
