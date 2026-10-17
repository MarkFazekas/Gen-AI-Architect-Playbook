// PreToolUse (Bash): block bypassing git hooks and the recorded decisions,
// and require approval for shell writes to protected files (so guard-edit cannot be sidestepped).
import { readFileSync } from 'node:fs';

import { isProtected, toRepoPath } from './protected-paths.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// ignore quoted text (e.g. a commit message mentioning "-n")
const command = (input.tool_input?.command ?? '').replaceAll(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""');

function decide(permissionDecision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

// rules match within one command segment, so text in a heredoc body does not trigger them
const RULES = [
  {
    pattern: /\bgit\b[^\n;&|]*\s--no-verify\b|\bgit\s+commit\b[^\n;&|]*\s-n\b|\bHUSKY=0\b/,
    decision: 'deny',
    reason: 'Bypassing git hooks is not allowed.',
  },
  {
    pattern: /\bgit\s+push\b[^\n;&|]*\s(--force(-with-lease)?|-f)\b/,
    decision: 'deny',
    reason: 'Force push is not allowed.',
  },
  { pattern: /\bnx\s+connect\b|\bnx-cloud\s/, decision: 'deny', reason: 'Nx Cloud is not used (neverConnectToCloud).' },
  { pattern: /\bnpm\s+publish\b/, decision: 'deny', reason: 'Publishing is not the agent’s job.' },
  {
    pattern: /\bnx\s+migrate\b|\bnpm\s+(update|up|audit\s+fix)\b/,
    decision: 'ask',
    reason: 'Dependency updates need human approval.',
  },
];

const hit = RULES.find(({ pattern }) => pattern.test(command));
if (hit) {
  decide(hit.decision, hit.reason);
}

const WRITES = /(^|[\s;&|])(>>?|tee|sed\s+-i|perl\s+-pi|mv|cp|rm|truncate|chmod|ln)(\s|$)|>>?/;
const touchesProtected = command
  .split(/[\s;&|<>]+/)
  .filter(Boolean)
  .some((token) => isProtected(toRepoPath(root, token)));
if (touchesProtected && WRITES.test(command)) {
  decide('ask', 'This command may modify a quality-gate or theme configuration: it needs human approval.');
}
