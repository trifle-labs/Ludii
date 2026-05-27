import { readFileSync } from 'node:fs';
const { compileLudemeSource } = await import('./dist/src/index.js');
const base = readFileSync('/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/connection/ConHex.lud','utf8');

function evalRegion(regionExpr) {
  const src = base.replace(
    /\(move Add \(to Vertex \(sites Empty Vertex\) if:\(is In \(to\) \(sites "Holes"\)\)\)/,
    `(move Add (to Vertex ${regionExpr})`
  );
  const game = compileLudemeSource(src);
  const ctx = game.start();
  const tos = [...new Set(game.moves(ctx).map(m=>m.to()))].sort((a,b)=>a-b);
  return tos;
}

for (const expr of [
  '(sites Board Vertex)',
  '(sites Outer Vertex)',
  '(sites Corners Vertex)',
  '(sites "Holes")',
]) {
  const r = evalRegion(expr);
  console.log(`${expr}: count=${r.length}  12in=${r.includes(12)}`);
  console.log(`   [${r.join(',')}]`);
}
