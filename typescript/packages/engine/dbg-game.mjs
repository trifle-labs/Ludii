import { readFileSync, readdirSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const { compileLudemeSource } = await import('./dist/src/index.js');
const LUD = process.argv[2];      // absolute path to .lud
const TDIR = process.argv[3];     // absolute path to trial dir
const game = compileLudemeSource(readFileSync(LUD, 'utf8'));
const tf = readdirSync(TDIR).find(f => f.startsWith('RandomTrial'));
const trial = parseTrial(readFileSync(`${TDIR}/${tf}`, 'utf8'));
let ctx = game.start();
const rm = trial.moves; let from=0; while(from<rm.length&&rm[from].mover===0)from++;
const gm = rm.slice(from);
let ply=0;
for (const rec of gm){
  if(game.over(ctx)){console.log(`over at ply ${ply}`);break;}
  const mv=game.moves(ctx);
  let m=mv.find(x=>x.from()===rec.from&&x.to()===rec.to)||mv.find(x=>x.to()===rec.to);
  if(!m){
    console.log(`NO MATCH ply ${ply}: rec from=${rec.from} to=${rec.to} mover=${rec.mover}; ts ${mv.length} moves`);
    console.log('  ts move tos:', mv.slice(0,30).map(x=>x.to()).join(','));
    console.log('  rec.to in ts tos?', mv.some(x=>x.to()===rec.to));
    break;
  }
  ctx=game.apply(ctx,m); ply++;
}
console.log(`replayed=${ply}/${gm.length} over=${game.over(ctx)} recWinner=${trial.winner} tsWinner=${ctx.winner??ctx.trial?.winner}`);
