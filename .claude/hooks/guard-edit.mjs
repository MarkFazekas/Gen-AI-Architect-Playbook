// PreToolUse (Edit|Write|MultiEdit): the agent must not weaken the quality gates.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isProtected, toRepoPath } from './protected-paths.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const toolInput = input.tool_input ?? {};
const file = toRepoPath(root, toolInput.file_path ?? '');

function decide(permissionDecision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

if (file === 'package-lock.json') {
  decide('deny', 'package-lock.json is written by npm only (npm install / npm ci).');
}

if (isProtected(file)) {
  decide('ask', `${file} is a quality-gate or theme configuration: changing it needs human approval.`);
}

// Only code files: docs may mention these words.
if (!/\.(ts|mts|cts|js|mjs|cjs|html)$/.test(file)) {
  process.exit(0);
}

// No new suppressions; edits that only keep an existing one are fine.
const SUPPRESSION = /eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error|\b(?:describe|it|test)\.only\(/g;
const count = (text) => (text ?? '').match(SUPPRESSION)?.length ?? 0;
const absPath = join(root, file);
const changes =
  input.tool_name === 'Write'
    ? [{ before: existsSync(absPath) ? readFileSync(absPath, 'utf8') : '', after: toolInput.content }]
    : (toolInput.edits ?? [toolInput]).map((edit) => ({ before: edit.old_string, after: edit.new_string }));
const added = changes.reduce((sum, { before, after }) => sum + count(after) - count(before), 0);
if (added > 0) {
  decide(
    'deny',
    'Do not add lint or type suppressions or focused tests (.only). Fix the code instead; if you think the rule is wrong, ask the user.',
  );
}
