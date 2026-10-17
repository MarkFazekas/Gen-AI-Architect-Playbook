// Stop: before the agent finishes, run lint, typecheck and unit tests on the affected projects.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
if (input.stop_hook_active) {
  process.exit(0); // allow stopping after one fix round to avoid an endless loop
}

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const changedFiles = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter((line) => line && !/^( D|D )/.test(line))
  .map((line) => line.slice(3).split(' -> ').at(-1));
if (changedFiles.length === 0) {
  process.exit(0);
}

try {
  execFileSync(
    join(root, 'node_modules', '.bin', 'nx'),
    ['affected', '-t', 'lint', 'typecheck', 'test', `--files=${changedFiles.join(',')}`, '--output-style=static'],
    { cwd: root, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
  );
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.split('\n').slice(-150).join('\n');
  process.stderr.write(
    `Quality gate (nx affected -t lint typecheck test) failed. Fix it before finishing:\n${output}\n`,
  );
  process.exit(2);
}
