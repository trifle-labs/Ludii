// Drift-checker: for each Java ludeme class, compare its TS class's constructor
// arity/shape against Java's reflected constructors (ludeme-reflection.json).
// Turns per-case compiler debugging into a mechanical list of drifted classes.
import { readFileSync } from 'node:fs';
const REFL = JSON.parse(readFileSync(new URL('./ludeme-reflection.json', import.meta.url), 'utf8'));
const MAP = JSON.parse(readFileSync(new URL('./java-ts-map.json', import.meta.url), 'utf8'));

// crude TS constructor arity: count top-level params of the first `constructor(...)`.
function tsCtorArity(file) {
  let src; try { src = readFileSync(new URL('../../' + file, import.meta.url), 'utf8'); } catch { return null; }
  const m = src.match(/\bconstructor\s*\(([\s\S]*?)\)\s*(?::|\{)/);
  if (!m) return { kind: 'no-ctor' };
  const body = m[1].trim();
  if (!body) return { arity: 0, hasConstructStatics: /static\s+construct/.test(src) };
  let depth = 0, n = 1;
  for (const c of body) { if ('([{<'.includes(c)) depth++; else if (')]}>'.includes(c)) depth--; else if (c === ',' && depth === 0) n++; }
  return { arity: n, hasConstructStatics: /static\s+construct/.test(src) };
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
import('node:fs').then(fs=>fs.writeFileSync(new URL('./drift-report.json', import.meta.url), JSON.stringify(report,null,1)));
