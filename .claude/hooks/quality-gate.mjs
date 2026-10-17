// Stop: before the agent finishes,
// 1. run lint, typecheck and unit tests on the affected projects;
// 2. make the agent report every quality-gate file it changed, in its final message (instead of approval prompts).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { hasSensitiveParts, isProtected, sensitivePartsOf } from './protected-paths.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
if (input.stop_hook_active) {
  process.exit(0); // one round of fixes and reporting, then the agent may stop
}

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const changedFiles = git('status', '--porcelain', '--untracked-files=all')
  .split('\n')
  .filter((line) => line && !/^( D|D )/.test(line))
  .map((line) => line.slice(3).split(' -> ').at(-1));
if (changedFiles.length === 0) {
  process.exit(0);
}

const messages = [];

try {
  execFileSync(
    join(root, 'node_modules', '.bin', 'nx'),
    ['affected', '-t', 'lint', 'typecheck', 'test', `--files=${changedFiles.join(',')}`, '--output-style=static'],
    { cwd: root, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
  );
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.split('\n').slice(-150).join('\n');
  messages.push(`Quality gate (nx affected -t lint typecheck test) failed. Fix it before finishing:\n${output}`);
}

const headVersion = (file) => {
  try {
    return git('show', `HEAD:${file}`);
  } catch {
    return '';
  }
};
const gateFiles = changedFiles.filter(
  (file) =>
    isProtected(file) ||
    (hasSensitiveParts(file) &&
      sensitivePartsOf(file, headVersion(file)) !== sensitivePartsOf(file, readFileSync(join(root, file), 'utf8'))),
);
if (gateFiles.length > 0) {
  messages.push(
    `You changed quality-gate or theme configuration (uncommitted): ${gateFiles.join(', ')}.\n` +
      'In your final message, list each of these files with what changed and why, under a "Quality-gate changes" heading.',
  );
}

if (messages.length > 0) {
  process.stderr.write(`${messages.join('\n\n')}\n`);
  process.exit(2);
}
