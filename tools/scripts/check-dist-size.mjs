// Fails when a build output is larger than the allowed deployment size.
// Usage: node tools/scripts/check-dist-size.mjs <dist-dir> <max-bytes>
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const [directory, maxBytesArgument] = process.argv.slice(2);
const maxBytes = Number(maxBytesArgument);
if (!directory || !Number.isFinite(maxBytes)) {
  console.error('Usage: node tools/scripts/check-dist-size.mjs <dist-dir> <max-bytes>');
  process.exit(1);
}

const files = readdirSync(directory, { recursive: true })
  .map((name) => join(directory, name))
  .filter((path) => statSync(path).isFile())
  .map((path) => ({ path: relative(directory, path), size: statSync(path).size }))
  .sort((first, second) => second.size - first.size);
const total = files.reduce((sum, file) => sum + file.size, 0);
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

console.log(`${directory}: ${kb(total)} of ${kb(maxBytes)} allowed`);
for (const file of files.slice(0, 5)) {
  console.log(`  ${kb(file.size).padStart(10)}  ${file.path}`);
}
if (total > maxBytes) {
  console.error(`Deployment size ${kb(total)} exceeds the ${kb(maxBytes)} limit.`);
  process.exit(1);
}
