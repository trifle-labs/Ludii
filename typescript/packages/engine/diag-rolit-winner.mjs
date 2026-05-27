import { readFileSync } from 'node:fs';
import { compileLudemeSource } from '/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine/dist/src/index.js';
const ROOT = '/Users/billy/GitHub/trifle-labs/Ludii';
const lud = readFileSync(`${ROOT}/Common/res/lud/board/space/territory/Rolit.lud`, 'utf8');
const trial = readFileSync(`${ROOT}/Player/res/random_trials/board/space/territory/Rolit/RandomTrial_0.txt`, 'utf8');
const game = compileLudemeSource(lud);
const n = game.board?.numSites ?? game.start().state.cells.length;

const recLines = trial.split('\n').filter(l => l.startsWith('Move=')).filter(l => !l.includes('mover=0'));
function recTo(line){ const pass=line.includes('Pass:'); const m=/from=(-?\d+),to=(-?\d+)/.exec(line); if(!m) return {from:-1,to:-1,pass}; return {from:+m[1], to:+m[2], pass}; }

let ctx = game.start();
let plies = 0;
for(let i=0;i<recLines.length;i++){
  const rec = recTo(recLines[i]);
  const mv = game.moves(ctx);
  let match;
  if(rec.pass) match = mv.find(m=>m.isPass?.());
  else match = mv.find(m=>m.to?.()===rec.to && m.from?.()===rec.from) ?? mv.find(m=>m.to?.()===rec.to);
  if(!match){
    console.log(`ply ${i}: NO MATCH rec from=${rec.from} to=${rec.to} pass=${rec.pass}; tsMoves=${mv.length}`,
      mv.slice(0,12).map(m=>`${m.from?.()}->${m.to?.()}${m.isPass?.()?'(P)':''}`).join(' '));
    break;
  }
  ctx = game.apply(ctx, match);
  plies++;
}
console.log('replayed plies:', plies, 'of', recLines.length);
console.log('game.over:', game.over(ctx));
console.log('ctx.winner:', ctx.winner, 'ctx.trial?.winner:', ctx.trial?.winner);
console.log('ctx.ranking?():', ctx.ranking?.(), 'ctx.trial?.ranking:', ctx.trial?.ranking);
console.log('ctx.active / mover:', ctx.active, ctx.mover, 'phase/pass?', ctx.consecutivePasses ?? ctx.numConsecutivePasses);
// scores
const st = ctx.state;
console.log('scores:', [1,2,3,4].map(p=>`P${p}=${st.score?.(p) ?? st.scores?.[p] ?? '?'}`).join(' '));
// territory by state
const byState={};
for(let s=0;s<n;s++){ const stt=st.stateAtSite?.(s)??0; if(st.isOccupiedSite?.(s)){ byState[stt]=(byState[stt]||0)+1; } }
console.log('sites by state:', JSON.stringify(byState));
console.log('rec winner=1 rankings=0,1,3,2,4');
