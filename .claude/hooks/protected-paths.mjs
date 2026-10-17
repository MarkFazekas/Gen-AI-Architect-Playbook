// Quality-gate and theme files: the agent may change them only with human approval.
// cspell.json is deliberately not protected: adding project words is routine.
import { isAbsolute, join, relative } from 'node:path';

const PROTECTED = [
  /(^|\/)eslint\.(config|angular)\.mjs$/,
  /(^|\/)tsconfig[\w.]*\.json$/,
  /(^|\/)project\.json$/,
  /(^|\/)(vite|vitest|playwright)\.config\.m?ts$/,
  /^nx\.json$/,
  /^\.prettierrc/,
  /^\.stylelintrc/,
  /^knip\.json$/,
  /^commitlint\.config\.mjs$/,
  /^\.npmrc$/,
  /^\.husky\//,
  /^tools\/lint-rules\//,
  /^libs\/shared\/theme\//,
  /^\.claude\/(settings\.json|hooks\/)/,
  /^\.github\/workflows\//,
];

export function toRepoPath(root, path) {
  return relative(root, isAbsolute(path) ? path : join(root, path)).replaceAll('\\', '/');
}

export function isProtected(repoPath) {
  return PROTECTED.some((pattern) => pattern.test(repoPath));
}
