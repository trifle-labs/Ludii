import { readFileSync } from 'node:fs';
const { compileLudemeSource } = await import('./dist/src/index.js');
let src = readFileSync('/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/connection/ConHex.lud','utf8');
// Replace the whole play move with a direct placement on Holes (no if, no then)
// Find the (play ...) and swap the move. Simplest: replace the first move-add line.
src = src.replace(
  /\(move Add \(to Vertex \(sites Empty Vertex\) if:\(is In \(to\) \(sites "Holes"\)\)\)/,
  '(move Add (to Vertex (sites "Holes"))'
);
const game = compileLudemeSource(src);
const ctx = game.start();
const tos = game.moves(ctx).map(m=>m.to()).sort((a,b)=>a-b);
console.log('Holes-as-destinations count:', tos.length);
console.log('contains 12?', tos.includes(12));
console.log('first 40:', tos.slice(0,40).join(','));
