// PreToolUse (Edit|Write|MultiEdit): hard stops only, no approval prompts.
// Changes to quality-gate files are reported at the end of the turn instead (see quality-gate.mjs).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { toRepoPath } from './protected-paths.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const toolInput = input.tool_input ?? {};
const file = toRepoPath(root, toolInput.file_path ?? '');

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

if (file === 'package-lock.json') {
  deny('package-lock.json is written by npm only (npm install / npm ci).');
}

// Only code files: docs may mention these words.
if (!/\.(ts|mts|cts|js|mjs|cjs|html)$/.test(file)) {
  process.exit(0);
}

// No new suppressions; edits that only keep an existing one are fine.
const SUPPRESSION = /eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error|\b(?:describe|it|test)\.only\(/g;
const count = (text) => (text ?? '').match(SUPPRESSION)?.length ?? 0;
const absPath = join(root, file);
const before = existsSync(absPath) ? readFileSync(absPath, 'utf8') : '';
const after =
  input.tool_name === 'Write'
    ? (toolInput.content ?? '')
    : (toolInput.edits ?? [toolInput]).reduce(
        (text, edit) =>
          edit.replace_all
            ? text.replaceAll(edit.old_string, edit.new_string)
            : text.replace(edit.old_string, edit.new_string),
        before,
      );
if (count(after) > count(before)) {
  deny(
    'Do not add lint or type suppressions or focused tests (.only). Fix the code instead; if you think the rule is wrong, ask the user.',
  );
}
