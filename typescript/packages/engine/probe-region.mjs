import { compileLudemeSource } from '/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine/dist/src/index.js';
const src = `
(game "T"
  (players 2)
  (equipment { (board (square 8)) (piece "Ball" Neutral) })
  (rules
    (start { (place "Ball0" coord:"D5" state:1) (place "Ball0" coord:"E5" state:2) (place "Ball0" coord:"E4" state:3) (place "Ball0" coord:"D4" state:4) })
    (play (move Add (piece "Ball0" state:(mover)) (to (sites Around (sites Occupied by:Neutral) Empty))))
    (end (if (all Passed) (byScore)))
  )
)`;
const game = compileLudemeSource(src);
const ctx = game.start();
const st = ctx.state;
const occ=[]; for(let s=0;s<64;s++){ if(st.isOccupiedSite(s)) occ.push(`${s}:who=${st.cells[s]},what=${st.whats[s]}`); }
console.log('occupied:', occ.join(' | '));
const mv = game.moves(ctx);
console.log('moves:', mv.length);
console.log('to sites:', mv.map(m=>m.to?.()).filter(t=>t>=0).sort((a,b)=>a-b).join(','));
