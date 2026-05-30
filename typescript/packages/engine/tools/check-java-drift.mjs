#!/usr/bin/env node
// Java -> TS port drift checker.
//
// Goal: give the port the property "if upstream Java changes, we know exactly
// which TS file to update". It scans the TS engine for `@java <Core/src/...java>`
// provenance annotations, records each referenced Java file's content hash in a
// manifest, and on re-run reports:
//   - DRIFTED : Java files whose content changed since the recorded hash (re-port needed)
//   - MISSING : referenced Java files not found on disk
//   - COVERAGE: how many Java ludeme classes (game/functions, game/rules,
//               game/equipment) have any TS @java reference vs. the total.
//
// Usage:
//   node tools/check-java-drift.mjs            # report only (compares to recorded manifest)
//   node tools/check-java-drift.mjs --record   # save current Java hashes as the baseline
//   node tools/check-java-drift.mjs --coverage-list  # also list unported ludeme classes
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ENGINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REPO = path.resolve(ENGINE, '..', '..', '..'); // .../Ludii
const SRC = path.join(ENGINE, 'src');
const MANIFEST = path.join(ENGINE, 'java-port-manifest.json');

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}
const hash = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);

// 1. Scan TS for @java references (format: `@java Core/src/.../Foo.java [ClassName]`).
const tsFiles = walk(SRC, '.ts');
const refs = [];
const javaRe = /@java\s+(\S+?\.java)\b/g;
for (const f of tsFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = javaRe.exec(txt))) refs.push({ ts: path.relative(ENGINE, f), java: m[1].replace(/^\.\//, '') });
}

// 2. Resolve + hash referenced Java files.
const cur = {}; // javaRelPath -> { hash, ts:Set }
const missing = [];
for (const r of refs) {
  const jp = path.join(REPO, r.java);
  if (!fs.existsSync(jp)) { missing.push(r); continue; }
  (cur[r.java] ||= { hash: hash(jp), ts: new Set() }).ts.add(r.ts);
}

// 3. Diff against recorded manifest.
let prev = {};
if (fs.existsSync(MANIFEST)) prev = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).java || {};
const drifted = [];
for (const [jp, info] of Object.entries(cur))
  if (prev[jp] && prev[jp].hash !== info.hash) drifted.push({ java: jp, was: prev[jp].hash, now: info.hash, ts: [...info.ts] });
const newlyReferenced = Object.keys(cur).filter((jp) => !prev[jp]);

// 4. Ludeme coverage. Track EVERY Java ludeme class (hash + port status), not
// just the ones already referenced in TS — so upstream changes are flagged
// across the entire ludeme surface, and the manifest doubles as the
// transliteration roadmap.
const ludemeRoots = ['Core/src/game/functions', 'Core/src/game/rules', 'Core/src/game/equipment'];
const referenced = new Set(Object.keys(cur));
let total = 0, ported = 0;
const unported = [];
const ludemeHashes = {}; // rel -> { hash, ported, ts:[] }
for (const d of ludemeRoots)
  for (const jf of walk(path.join(REPO, d), '.java')) {
    total++;
    const rel = path.relative(REPO, jf);
    const isPorted = referenced.has(rel);
    ludemeHashes[rel] = { hash: hash(jf), ported: isPorted, ts: isPorted ? [...cur[rel].ts] : [] };
    if (isPorted) ported++; else unported.push(rel);
  }
// Drift across the FULL ludeme surface (re-port needed when Java changes).
let prevLudeme = (prev && prev.__ludemes) || {};
if (fs.existsSync(MANIFEST)) prevLudeme = (JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).ludemes) || {};
const ludemeDrift = [];
for (const [rel, info] of Object.entries(ludemeHashes))
  if (prevLudeme[rel] && prevLudeme[rel].hash !== info.hash)
    ludemeDrift.push({ java: rel, was: prevLudeme[rel].hash, now: info.hash, ported: info.ported });

// Report.
console.log('=== Java -> TS port drift report ===');
console.log(`TS @java refs: ${refs.length}   distinct Java files referenced: ${Object.keys(cur).length}`);
console.log(`MISSING (referenced Java not found): ${missing.length}`);
missing.slice(0, 15).forEach((m) => console.log(`   ${m.java}  <-  ${m.ts}`));
console.log(`DRIFTED (Java changed since recorded baseline): ${drifted.length}`);
drifted.forEach((d) => console.log(`   ${d.java}  ${d.was} -> ${d.now}   (TS: ${d.ts.join(', ')})`));
if (Object.keys(prev).length) console.log(`NEWLY REFERENCED since baseline: ${newlyReferenced.length}`);
console.log(`LUDEME COVERAGE: ${ported}/${total} (${(100 * ported / total).toFixed(1)}%) game ludeme classes have a TS @java reference`);
console.log(`  unported ludeme classes: ${unported.length}`);
console.log(`LUDEME DRIFT (tracked Java ludeme changed since baseline): ${ludemeDrift.length}`);
ludemeDrift.slice(0, 30).forEach((d) => console.log(`   ${d.ported ? '[PORTED]' : '[unported]'} ${d.java}  ${d.was} -> ${d.now}`));
if (process.argv.includes('--coverage-list')) {
  console.log('--- unported (first 60) ---');
  unported.slice(0, 60).forEach((u) => console.log('   ' + u));
}

if (process.argv.includes('--record')) {
  const out = { recorded: new Date().toISOString(), java: {}, ludemes: ludemeHashes };
  for (const [jp, info] of Object.entries(cur)) out.java[jp] = { hash: info.hash, ts: [...info.ts] };
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2));
  console.log(`\nRecorded baseline manifest: ${path.relative(ENGINE, MANIFEST)} (${Object.keys(out.java).length} core Java files + ${Object.keys(ludemeHashes).length} ludeme classes tracked)`);
} else {
  console.log('\n(run with --record to save current Java hashes as the drift baseline)');
}
