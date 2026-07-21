// Generates java-ts-map.json: Java ludeme class -> { file, cls } for the TS port,
// from `// @java <path>` tags. When MULTIPLE TS files tag the same Java class
// (e.g. faithful Count.ts vs early Count1to1.ts), PREFER the one whose constructor
// arity matches a Java constructor arity (from the reflection dump) — i.e. the
// faithful, non-drifted version. This eliminates a large class of constructor drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const REFL = JSON.parse(readFileSync(new URL('./ludeme-reflection.json', import.meta.url), 'utf8'));
const javaArities = (jc) => new Set((REFL[jc]?.executables ?? []).filter(e => e.kind === 'constructor').map(e => e.params.length));

function tsCtorArity(src) {
  const m = src.match(/\bconstructor\s*\(([\s\S]*?)\)\s*(?::|\{|;)/);
  if (!m) return null;
  const body = m[1].trim();
  if (!body) return 0;
  let depth = 0, n = 1;
  for (const c of body) { if ('([{<'.includes(c)) depth++; else if (')]}>'.includes(c)) depth--; else if (c === ',' && depth === 0) n++; }
  return n;
}

const files = execSync("find src -name '*.ts'", { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const cands = {}; // jc -> [{file, cls, arity}]
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  const m = t.match(/@java\s+([A-Za-z0-9_./-]+\.java)/);
  if (!m) continue;
  const jc = m[1].replace(/^[A-Za-z]+\/src\//, '').replace(/\.java$/, '').replace(/\//g, '.');
  const ec = t.match(/export (?:abstract )?class (\w+)/);
  if (!ec) continue;
  (cands[jc] = cands[jc] ?? []).push({ file: f, cls: ec[1], arity: tsCtorArity(t) });
}
const map = {};
let repointed = 0;
for (const [jc, list] of Object.entries(cands)) {
  const ja = javaArities(jc);
  // prefer a candidate whose arity matches a Java constructor arity; tiebreak: not *1to1; then first.
  const faithful = list.filter(c => c.arity !== null && ja.has(c.arity));
  const pickFrom = faithful.length ? faithful : list;
  const pick = pickFrom.find(c => !/1to1/.test(c.cls)) ?? pickFrom[0];
  if (faithful.length && list[0] !== pick) repointed++;
  map[jc] = { file: pick.file, cls: pick.cls };
}
writeFileSync(new URL('./java-ts-map.json', import.meta.url), JSON.stringify(map, null, 1));
console.log('java-ts-map.json:', Object.keys(map).length, 'classes;', repointed, 'repointed to a faithful-arity twin');
