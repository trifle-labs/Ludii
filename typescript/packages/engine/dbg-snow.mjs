import { readFileSync, readdirSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const { compileLudemeSource } = await import('./dist/src/index.js');
const COMMON = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/blocking';
const TRIALS = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/space/blocking';
const g = 'Snowpaque';
const game = compileLudemeSource(readFileSync(`${COMMON}/${g}.lud`, 'utf8'));
const tdir = `${TRIALS}/${g}`;
const tf = readdirSync(tdir).find(f => f.startsWith('RandomTrial'));
const trial = parseTrial(readFileSync(`${tdir}/${tf}`, 'utf8'));
let ctx = game.start();
const rm = trial.moves; let from=0; while(from<rm.length&&rm[from].mover===0)from++;
const gm = rm.slice(from);
for (let i=0;i<3 && i<gm.length;i++){
  const rec=gm[i];
  console.log(`--- before ply ${i}: mover=${ctx.state.mover} phase=${ctx.state.phase ?? ctx.state.currentPhase ?? '?'} over=${game.over(ctx)} legalRaw=${game.legalMovesRaw(ctx).length}`);
  if(game.over(ctx)){console.log('  OVER, winner=',ctx.winner??ctx.trial?.winner);break;}
  const mv=game.moves(ctx); let m=mv.find(x=>x.to()===rec.to);
  if(!m){console.log(`  no match rec.to=${rec.to}`);break;}
  ctx=game.apply(ctx,m);
}
console.log('phase keys on state:', Object.keys(ctx.state).filter(k=>/phase/i.test(k)));
