// SessionStart: check the Node version against .nvmrc; the output is added to the session context.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const wanted = readFileSync(join(root, '.nvmrc'), 'utf8').trim();
const actual = process.versions.node.split('.')[0];
if (actual !== wanted) {
  process.stdout.write(
    `WARNING: Node ${process.versions.node} is running, .nvmrc requires ${wanted}. Ask the user to run: nvm use\n`,
  );
}
