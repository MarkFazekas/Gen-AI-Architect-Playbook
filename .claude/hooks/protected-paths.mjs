// Quality-gate and theme files: the Stop hook makes the agent report every change to them.
// knip.json is deliberately not listed: adding ignores is routine.
import { isAbsolute, join, relative } from 'node:path';

const PROTECTED = [
  /(^|\/)eslint\.(config|angular)\.mjs$/,
  /(^|\/)tsconfig[\w.]*\.json$/,
  /(^|\/)(vite|vitest|playwright)\.config\.m?ts$/,
  /^nx\.json$/,
  /^\.prettierrc/,
  /^\.stylelintrc/,
  /^commitlint\.config\.mjs$/,
  /^\.npmrc$/,
  /^\.husky\//,
  /^tools\/lint-rules\//,
  /^libs\/shared\/theme\//,
  /^\.claude\/(settings\.json|hooks\/)/,
  /^\.github\/workflows\//,
];

// Routinely edited files: only changes to their gate-related parts need approval.
const SENSITIVE_PARTS = [
  {
    file: /(^|\/)project\.json$/,
    parts: [
      /"tags"\s*:\s*\[[^\]]*\]/g,
      /"implicitDependencies"\s*:\s*\[[^\]]*\]/g,
      /"coverage\w*"\s*:\s*(\{[^{}]*\}|\[[^\]]*\]|[^,}\s]+)/g,
    ],
  },
];

export function toRepoPath(root, path) {
  return relative(root, isAbsolute(path) ? path : join(root, path)).replaceAll('\\', '/');
}

export function isProtected(repoPath) {
  return PROTECTED.some((pattern) => pattern.test(repoPath));
}

export function hasSensitiveParts(repoPath) {
  return SENSITIVE_PARTS.some(({ file }) => file.test(repoPath));
}

// The gate-related parts of a file's text, normalized, so a before/after comparison shows whether they changed.
export function sensitivePartsOf(repoPath, text) {
  const spec = SENSITIVE_PARTS.find(({ file }) => file.test(repoPath));
  if (!spec) {
    return '';
  }
  return spec.parts
    .flatMap((pattern) => (text ?? '').match(pattern) ?? [])
    .map((part) => part.replaceAll(/\s+/g, ''))
    .join('\n');
}
