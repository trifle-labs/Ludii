#!/usr/bin/env node
// Classifies every 1:1 ludeme file under src/ludemes by port status, so the
// faithful-transliteration effort can target precisely:
//   STUB      — has "TODO Phase 2"/"not implemented"; no register() → falls back to legacy interpreter
//   REGISTERED— calls register() (dispatches live via the 1:1 file)
//   PLAIN     — has real code but no register() and no TODO (e.g. enum/type file)
// Also flags which registered ludemes are currently DENYLISTED in registry.ts.
import fs from 'node:fs';
import path from 'node:path';

const ENGINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LUDEMES = path.join(ENGINE, 'src', 'ludemes');
const REG = fs.readFileSync(path.join(LUDEMES, 'registry.ts'), 'utf8');
// denylisted keys: lines inside DENY set like 'bool:Threatened',
const deny = new Set([...REG.matchAll(/'([a-z]+:[A-Za-z0-9_]+)'/g)].map((m) => m[1])
  .filter((k) => REG.slice(REG.indexOf('DENY'), REG.indexOf('registered =')).includes(`'${k}'`)));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.ts') && e.name !== 'registry.ts' && e.name !== 'index.ts') out.push(p);
  }
  return out;
}

const files = walk(LUDEMES);
const byPkg = {};
let stub = 0, registered = 0, plain = 0, denied = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const isStub = /TODO Phase 2|not implemented/.test(txt);
  const regMatch = txt.match(/register\(\s*'([a-z]+)'\s*,\s*'([A-Za-z0-9_]+)'/);
  const status = regMatch ? 'REGISTERED' : (isStub ? 'STUB' : 'PLAIN');
  const pkg = path.relative(LUDEMES, path.dirname(f)).split('/').slice(0, 5).join('/');
  (byPkg[pkg] ||= { STUB: 0, REGISTERED: 0, PLAIN: 0 })[status]++;
  if (status === 'STUB') stub++; else if (status === 'REGISTERED') { registered++; if (regMatch && deny.has(regMatch[1] + ':' + regMatch[2])) denied++; } else plain++;
}

console.log('=== Ludeme file port status ===');
console.log(`total files: ${files.length}  STUB: ${stub}  REGISTERED(live-ish): ${registered}  PLAIN: ${plain}  (of registered, DENYLISTED: ${denied})`);
console.log('\n=== STUB count by package (faithful-port worklist) ===');
Object.entries(byPkg)
  .filter(([, v]) => v.STUB > 0)
  .sort((a, b) => b[1].STUB - a[1].STUB)
  .forEach(([p, v]) => console.log(String(v.STUB).padStart(4), p));
