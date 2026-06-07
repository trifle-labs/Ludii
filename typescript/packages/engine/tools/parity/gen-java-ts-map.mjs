// Generates java-ts-map.json: Java ludeme class name -> { file, cls } for the TS
// port, read from the `// @java <path>` provenance tags. Used by the faithful
// ArgClass.compile() port to instantiate the ported TS class for a resolved symbol.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const files = execSync("find src -name '*.ts'", { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const map = {};
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  const m = t.match(/@java\s+([A-Za-z0-9_./-]+\.java)/);
  if (!m) continue;
  const jp = m[1].replace(/^[A-Za-z]+\/src\//, '').replace(/\.java$/, '').replace(/\//g, '.');
  const ec = t.match(/export (?:abstract )?class (\w+)/);
  if (ec) map[jp] = { file: f, cls: ec[1] };
}
writeFileSync('tools/parity/java-ts-map.json', JSON.stringify(map, null, 1));
console.log('java-ts-map.json:', Object.keys(map).length, 'classes');
