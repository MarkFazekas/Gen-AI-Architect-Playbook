// PreToolUse (Bash): hard stops only, no approval prompts.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
// ignore quoted text (e.g. a commit message mentioning "-n")
const command = (input.tool_input?.command ?? '').replaceAll(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""');

// rules match within one command segment, so text in a heredoc body does not trigger them
const RULES = [
  {
    pattern: /\bgit\b[^\n;&|]*\s--no-verify\b|\bgit\s+commit\b[^\n;&|]*\s-n\b|\bHUSKY=0\b/,
    reason: 'Bypassing git hooks is not allowed.',
  },
  { pattern: /\bgit\s+push\b[^\n;&|]*\s(--force(-with-lease)?|-f)\b/, reason: 'Force push is not allowed.' },
  { pattern: /\bnx\s+connect\b|\bnx-cloud\s/, reason: 'Nx Cloud is not used (neverConnectToCloud).' },
  { pattern: /\bnpm\s+publish\b/, reason: 'Publishing is not the agent’s job.' },
];

const hit = RULES.find(({ pattern }) => pattern.test(command));
if (hit) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: hit.reason,
      },
    }),
  );
}
