import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
// Resolve the engine dir relative to this script (tools/proof/ -> engine) so the
// tool measures the CURRENT working tree (e.g. a git worktree), not a hardcoded path.
const eng = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const { ArgCompiler } = await import(`${eng}/dist/src/ludii/compiler/arg/ArgCompiler.js`);

const all = execSync(`find /Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board -name '*.lud'`, { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(p => !/\/(test|wip|bad|plain|subgame)\//.test(p));
const step = Math.floor(all.length / 60);
const sample = all.filter((_, i) => i % step === 0).slice(0, 60);

let ok = 0;
let fail = 0;
const reasons = {};
const failures = [];

for (const p of sample) {
  let src;
  try {
    src = readFileSync(p, 'utf8');
  } catch {
    continue;
  }
  const compiler = new ArgCompiler();
  try {
    const game = compiler.compileGame(src);
    if (game) ok++;
    else {
      fail++;
      reasons['null game'] = (reasons['null game'] || 0) + 1;
      failures.push({ path: p, reason: 'null game' });
    }
  } catch (e) {
    fail++;
    const msg = (e.message || String(e)).split('\n')[0].slice(0, 120);
    const detail = compiler.lastDivergence ? `${msg} [${compiler.lastDivergence}]` : msg;
    reasons[detail] = (reasons[detail] || 0) + 1;
    failures.push({ path: p, reason: detail });
  }
}

console.log(`ArgCompiler coverage on ${sample.length} sampled games: ${ok} compiled, ${fail} failed (${(100 * ok / sample.length).toFixed(0)}%)`);
console.log('\nTop failure reasons:');
Object.entries(reasons)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([r, c]) => console.log(`  ${c}  ${r}`));

console.log('\nFirst failing games:');
failures.slice(0, 10).forEach(({ path, reason }) => {
  console.log(`  ${path.replace('/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/', '')}: ${reason}`);
});

