import { readFileSync, readdirSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const eng = await import('./dist/src/index.js');
const { compileLudemeSource } = eng;

const COMMON = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/blocking';
const TRIALS = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/space/blocking';

for (const g of process.argv.slice(2)) {
  const game = compileLudemeSource(readFileSync(`${COMMON}/${g}.lud`, 'utf8'));
  const tdir = `${TRIALS}/${g}`;
  const tf = readdirSync(tdir).find(f => f.startsWith('RandomTrial'));
  const trial = parseTrial(readFileSync(`${tdir}/${tf}`, 'utf8'));
  let ctx = game.start();
  const rm = trial.moves; let from = 0; while (from < rm.length && rm[from].mover === 0) from++;
  const gm = rm.slice(from);
  let ply = 0, broke = false;
  for (const rec of gm) {
    if (game.over(ctx)) break;
    const mv = game.moves(ctx);
    let m = mv.find(x => x.from() === rec.from && x.to() === rec.to) || mv.find(x => x.to() === rec.to);
    if (!m) { broke = true; console.log(`  [no match ply ${ply} rec to=${rec.to}; ${mv.length} ts moves]`); break; }
    ctx = game.apply(ctx, m); ply++;
  }
  console.log(`\n${g}: numSites=${game.numSites} replayed=${ply}/${gm.length} broke=${broke} over=${game.over(ctx)} recWinner=${trial.winner} tsWinner=${ctx.winner ?? ctx.trial?.winner}`);
  // At final position: how many empty cells, and what does TS think the next player can play?
  const st = ctx.state;
  let empties = [];
  for (let s = 0; s < game.numSites; s++) { const o = st.cells?.[s] ?? 0; const w = st.whats?.[s] ?? 0; if (!o && !w) empties.push(s); }
  console.log(`  empty cells: ${empties.length}  -> ${empties.slice(0,20).join(',')}`);
  const raw = game.legalMovesRaw ? game.legalMovesRaw(ctx) : game.moves(ctx);
  console.log(`  legalMovesRaw at final (mover=${st.mover}): ${raw.length}`);
  for (const m of raw.slice(0, 10)) console.log(`    to=${m.to()} from=${m.from()} isPass=${m.isPass?.()}`);
}
