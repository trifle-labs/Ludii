import { readFileSync, readdirSync } from 'node:fs';
const { compileLudemeSource } = await import('./dist/src/index.js');
import { parseTrial } from './test/parity/trial-format.mjs';
const LUD = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/sow/two_rows/Andada.lud';
const TDIR = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/sow/two_rows/Andada';
const game = compileLudemeSource(readFileSync(LUD, 'utf8'));
const tf = 'RandomTrial_0.txt';
const trial = parseTrial(readFileSync(`${TDIR}/${tf}`, 'utf8'));
let ctx = game.start();
const rm = trial.moves; let i = 0; while (i < rm.length && rm[i].mover === 0) i++;
console.log('numSites=', game.numSites, 'first real move idx=', i, 'total recorded=', rm.length);
for (let ply = 0; ply < 12 && i < rm.length; ply++, i++) {
  const rec = rm[i];
  const moves = game.moves(ctx);
  const mv = ctx.state?.mover ?? ctx.mover;
  console.log(`\n--- ply ${ply}: ctx.mover=${mv}  tsMoveCount=${moves.length}  recorded: mover=${rec.mover} from=${rec.from} to=${rec.to}${rec.pass?' [PASS]':''}`);
  console.log(`    ts moves(from): [${moves.map(m=>m.from()).join(',')}]  anyPass=${moves.some(m=>m.isPass&&m.isPass())}`);
  // recorded pass
  let m;
  if (rec.from === -1 && rec.to === -1) {
    m = moves.find(x => x.isPass && x.isPass());
  } else {
    m = moves.find(x => x.from() === rec.from && x.to() === rec.to) || moves.find(x => x.from() === rec.from);
  }
  if (!m) { console.log('    >>> NO MATCH — diverged here'); break; }
  ctx = game.apply(ctx, m);
}
