import { readFileSync, readdirSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const eng = await import('./dist/src/index.js');
const { compileLudemeSource } = eng;

const COMMON = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/connection';
const TRIALS = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/space/connection';

const games = process.argv.slice(2);
for (const g of games) {
  const lud = `${COMMON}/${g}.lud`;
  let game;
  try { game = compileLudemeSource(readFileSync(lud, 'utf8')); }
  catch (e) { console.log(`${g}: COMPILE_FAIL ${e.message?.slice(0,80)}`); continue; }
  const tdir = `${TRIALS}/${g}`;
  let files;
  try { files = readdirSync(tdir).filter(f => f.startsWith('RandomTrial')); }
  catch { console.log(`${g}: no trials dir`); continue; }
  for (const tf of files) {
    const trial = parseTrial(readFileSync(`${tdir}/${tf}`, 'utf8'));
    let ctx = game.start();
    const recMoves = trial.moves;
    let from = 0; while (from < recMoves.length && recMoves[from].mover === 0) from++;
    const gm = recMoves.slice(from);
    let ply = 0, broke = false;
    for (const rec of gm) {
      if (game.over(ctx)) break;
      const tsMoves = game.moves(ctx);
      let m = tsMoves.find(mv => mv.from() === rec.from && mv.to() === rec.to)
            || tsMoves.find(mv => mv.to() === rec.to);
      if (!m) { broke = true; break; }
      ctx = game.apply(ctx, m); ply++;
    }
    const tsW = ctx.winner ?? ctx.trial?.winner;
    const status = broke ? 'MOVE_MISMATCH' : (tsW === trial.winner ? 'OUTCOME_OK' : `WINNER_MISMATCH(rec=${trial.winner} ts=${tsW})`);
    console.log(`${g}/${tf}: ${status}  ply=${ply}/${gm.length} over=${game.over(ctx)}`);
  }
}
