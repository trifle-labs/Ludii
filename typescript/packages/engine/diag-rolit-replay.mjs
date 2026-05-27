import { readFileSync } from 'node:fs';
import { compileLudemeSource } from '/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine/dist/src/index.js';
const ROOT = '/Users/billy/GitHub/trifle-labs/Ludii';
const lud = readFileSync(`${ROOT}/Common/res/lud/board/space/territory/Rolit.lud`, 'utf8');
const trial = readFileSync(`${ROOT}/Player/res/random_trials/board/space/territory/Rolit/RandomTrial_0.txt`, 'utf8');
const game = compileLudemeSource(lud);
const n = game.board?.numSites ?? game.start().state.cells.length;

// Parse recorded moves (to-site only, enough to match)
const recLines = trial.split('\n').filter(l => l.startsWith('Move=')).filter(l => !l.includes('mover=0'));
function recTo(line){ const m=/from=(-?\d+),to=(-?\d+)/.exec(line); return {from:+m[1], to:+m[2]}; }

function dump(st, label){
  const occ=[];
  for(let s=0;s<n;s++){
    const who=st.cells?.[s]??0, what=st.whats?.[s]??0, stt=st.stateAtSite?.(s)??0, h=st.stackSize?.(s)??0;
    if(who||what||stt||h) occ.push(`${s}:w${who}/h${h}/c${what}/s${stt}`);
  }
  console.log(label, occ.join(' '));
}

let ctx = game.start();
dump(ctx.state, 'START:');
const stopAt = Number(process.argv[2] ?? 4);
for(let i=0;i<=stopAt && i<recLines.length;i++){
  const rec = recTo(recLines[i]);
  const mv = game.moves(ctx);
  if(i===stopAt){
    console.log(`\n=== ply ${i} mover=${ctx.mover} recTo=${rec.to} ===`);
    dump(ctx.state, `state@ply${i}:`);
    console.log(`tsMoves(${mv.length}):`, mv.map(m=>`${m.from?.()}->${m.to?.()}[${m.actions?.map(a=>a.constructor.name).join(',')}]`).join(' | '));
    const match = mv.find(m=>m.to?.()===rec.to);
    console.log('recorded-to match found in TS?', !!match, 'recTo=', rec.to);
    if(match){
      for(const a of match.actions){
        const o=a; console.log('  ACT', a.constructor.name, JSON.stringify({to:o.toIndex??o.to?.(), what:o.whatIndex??o.what, owner:o.ownerIndex, state:o.stateValue??o.state, onStack:o.onStack}));
      }
    }
    break;
  }
  const match = mv.find(m=>m.to?.()===rec.to) ?? mv.find(m=>!m.isPass?.());
  if(!match){ console.log(`ply ${i}: NO MATCH for to=${rec.to}, moves=${mv.length}`); break; }
  ctx = game.apply ? game.apply(ctx, match) : ctx.applyMove(match);
}
