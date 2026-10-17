// PostToolUse (Edit|Write|MultiEdit): format, autofix, and report the remaining problems back to the agent.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const file = input.tool_input?.file_path ?? '';
if (!/\.(ts|mts|mjs|html|scss|json|md)$/.test(file) || /node_modules|package-lock\.json/.test(file)) {
  process.exit(0);
}

function run(tool, args) {
  try {
    execFileSync(join(root, 'node_modules', '.bin', tool), args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return '';
  } catch (error) {
    return `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
  }
}

const problems = [
  run('prettier', ['--write', '--log-level=warn', '--ignore-unknown', file]),
  /\.(ts|html)$/.test(file) ? run('eslint', ['--fix', '--max-warnings=0', '--no-warn-ignored', file]) : '',
  /\.scss$/.test(file) ? run('stylelint', ['--fix', '--allow-empty-input', file]) : '',
].filter(Boolean);

// exit code 2: stderr is fed back to the agent, which fixes it right away
if (problems.length > 0) {
  process.stderr.write(`Problems in ${relative(root, file)}, fix them:\n${problems.join('\n')}\n`);
  process.exit(2);
}
