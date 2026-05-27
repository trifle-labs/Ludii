import { readFileSync } from 'node:fs';
import { compileLudemeSource } from '/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine/dist/src/index.js';
const ROOT='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud';
const rel = process.argv[2] || 'board/space/territory/Rolit.lud';
const game = compileLudemeSource(readFileSync(`${ROOT}/${rel}`,'utf8'));
let ctx = game.start();
let st = ctx.state;
const b = game.board;
const n = b?.numSites ?? b?.numCells ?? st.cells.length;
function dump(label){
  const s2=ctx.state;
  const occ=[];
  for(let s=0;s<n;s++){
    const who=s2.cells?.[s], what=s2.whats?.[s], stt=s2.stateAtSite?.(s);
    if((who&&who>0)||(what&&what>0)||(stt&&stt>0)) occ.push(`${s}:who=${who},what=${what},state=${stt}`);
  }
  console.log(label, occ.join(' | '));
}
dump('start occ:');
let mv = game.moves(ctx);
console.log('ply0 moves:', mv.length, mv.slice(0,8).map(m=>`${m.from?.()}->${m.to?.()}${m.isPass?.()?'(pass)':''}`).join(' | '));
// apply first recorded-ish move; we don't have the trial, so apply move to 19 if exists (center area)
// Instead just apply the first non-pass move and re-dump
function applyMove(m){
  ctx = ctx.applyMove ? ctx.applyMove(m) : game.apply(ctx, m);
}
const target = Number(process.argv[3] ?? 37);
const first = mv.find(m=>m.to?.()===target) ?? mv.find(m=>!m.isPass?.());
console.log('applying:', first?.from?.(), '->', first?.to?.(), 'acts=', first?.actions?.map(a=>a.constructor.name).join(','));
applyMove(first);
dump('after move occ:');
// neutral occupancy probe
const s2=ctx.state;
const neutralOcc=[]; for(let s=0;s<n;s++){ if(s2.isOccupiedSite?.(s) && (s2.cells[s]??0)===0) neutralOcc.push(s); }
console.log('neutral-occupied sites (who=0,occupied):', neutralOcc.join(','));
let mv2 = game.moves(ctx);
console.log('ply1 mover=',ctx.mover,'moves:', mv2.length, mv2.slice(0,12).map(m=>`${m.from?.()}->${m.to?.()}${m.isPass?.()?'(pass)':''}[${m.actions?.map(a=>a.constructor.name).join(',')}]`).join(' | '));
