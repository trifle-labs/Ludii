// Drift-checker: for each Java ludeme class, compare its TS class's constructor
// arity/shape against Java's reflected constructors (ludeme-reflection.json).
// Turns per-case compiler debugging into a mechanical list of drifted classes.
import { readFileSync, writeFileSync } from 'node:fs';
const REFL = JSON.parse(readFileSync(new URL('./ludeme-reflection.json', import.meta.url), 'utf8'));
const MAP = JSON.parse(readFileSync(new URL('./java-ts-map.json', import.meta.url), 'utf8'));

// TS constructor arity of the IMPLEMENTATION constructor. Robust against two traps
// that previously inflated counts: (1) `constructor(...)` text inside @java provenance
// JSDoc comments, (2) TS overload SIGNATURES (which end in `;`, not `{`). We strip
// comments, then balanced-paren scan for the constructor whose `)` is followed by `{`.
function tsCtorArity(file) {
  let raw; try { raw = readFileSync(new URL('../../' + file, import.meta.url), 'utf8'); } catch { return null; }
  const hasConstructStatics = /static\s+construct/.test(raw);
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  let idx = 0;
  while ((idx = src.indexOf('constructor', idx)) !== -1) {
    let p = idx + 'constructor'.length;
    while (p < src.length && /\s/.test(src[p])) p++;
    if (src[p] !== '(') { idx += 11; continue; }
    let depth = 0, end = -1;
    for (let i = p; i < src.length; i++) { const c = src[i]; if (c === '(') depth++; else if (c === ')') { depth--; if (depth === 0) { end = i; break; } } }
    if (end === -1) { idx += 11; continue; }
    let q = end + 1; while (q < src.length && /\s/.test(src[q])) q++;
    if (src[q] === '{') {
      const body = src.slice(p + 1, end).trim();
      if (!body) return { arity: 0, hasConstructStatics };
      const parts = []; let d = 0, cur = '';
      for (const c of body) { if ('([{<'.includes(c)) { d++; cur += c; } else if (')]}>'.includes(c)) { d--; cur += c; } else if (c === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += c; }
      parts.push(cur);
      return { arity: parts.filter((x) => x.trim().length > 0).length, hasConstructStatics };
    }
    idx = end + 1;
  }
  return { kind: 'no-ctor', hasConstructStatics };
}

let checked = 0, drift = 0, noTs = 0; const report = [];
for (const [jc, meta] of Object.entries(REFL)) {
  const ctors = meta.executables.filter(e => e.kind === 'constructor');
  if (ctors.length === 0) continue;
  const ts = MAP[jc];
  if (!ts) { noTs++; continue; }
  checked++;
  const info = tsCtorArity(ts.file);
  if (!info || info.kind === 'no-ctor') continue;
  const javaArities = new Set(ctors.map(c => c.params.length));
  const javaConstructCount = meta.executables.filter(e => e.kind === 'construct').length;
  // Drift if TS single-ctor arity matches NO Java constructor arity, AND no construct statics to absorb it.
  if (info.arity !== undefined && !javaArities.has(info.arity)) {
    drift++;
    report.push({ jc, cls: ts.cls, file: ts.file, tsArity: info.arity, javaArities: [...javaArities], javaConstructCount, hasConstructStatics: !!info.hasConstructStatics });
  }
}
report.sort((a,b)=> (a.javaConstructCount-b.javaConstructCount));
console.log(`checked ${checked} mapped ludeme classes; ${drift} with constructor-arity drift; ${noTs} unmapped`);
console.log('\nSample drifted classes (tsArity not in javaArities):');
for (const r of report.slice(0, 20)) console.log(`  ${r.cls} ts=${r.tsArity} java=[${r.javaArities}] construct=${r.javaConstructCount} ${r.file.replace('src/ludemes/','')}`);
writeFileSync(new URL('./drift-report.json', import.meta.url), JSON.stringify(report, null, 1));
