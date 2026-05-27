import { readFileSync } from 'node:fs';
import { compileLudemeSource } from './dist/src/index.js';
const ROOT='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud';
for (const rel of process.argv.slice(2)) {
  console.log(`\n===== ${rel} =====`);
  let game; try { game=compileLudemeSource(readFileSync(`${ROOT}/${rel}`,'utf8')); }
  catch(e){ console.log('COMPILE_FAIL:',e.message); continue; }
  const b=game.board;
  console.log('board.numCells=', b?.numCells ?? b?.cells?.length, 'width=',b?.width,'height=',b?.height,'tiling=',b?.tiling?.kind, 'numSites=', b?.numSites);
  let ctx; try{ctx=game.start();}catch(e){console.log('START_FAIL:',e.message);continue;}
  const st=ctx.state;
  const n = (b?.numCells ?? b?.cells?.length ?? st.cells?.length ?? 0);
  const occ=[];
  for(let s=0;s<n;s++){
    const who=st.cells?.[s], what=st.whats?.[s], cnt=st.countAt?.[s];
    const stk=st.stacks?.[s];
    if((who&&who>0)||(cnt&&cnt>0)||(stk&&stk.length)) occ.push(`${s}:who=${who},what=${what},cnt=${cnt},stk=${stk?JSON.stringify(stk):'-'}`);
  }
  console.log('occupied (first 10):', occ.slice(0,10).join(' | '));
  let mv; try{mv=game.moves(ctx);}catch(e){console.log('MOVES_THREW:',e.message);console.log(e.stack?.split('\n').slice(0,4).join('\n'));continue;}
  console.log('moves count:', mv.length);
  console.log('first:', mv.slice(0,6).map(m=>`${m.from?.()}->${m.to?.()}${m.isPass?.()?'(pass)':''}`).join(' | '));
}
