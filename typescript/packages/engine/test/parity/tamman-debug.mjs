import { compileLudemeSource } from '../../dist/src/index.js';
import { readFileSync } from 'node:fs';

const src = readFileSync('/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/race/reach/Tamman.lud', 'utf8');
const game = compileLudemeSource(src);
const ctx = game.start();

console.log('numSites:', game.numSites);
const tracks = ctx.board?.tracks ?? game.board?.tracks;
if (tracks) {
  for (const t of tracks) {
    console.log(`track "${t.name}" sites:`, JSON.stringify(t.sites.slice(0,15)));
  }
}
console.log('diceValues init:', ctx.state.diceValues);
console.log('mover:', ctx.state.mover);
console.log('cells (occupied):', ctx.state.cells.map((v,i) => v ? `${i}:${v}` : null).filter(Boolean).join(', '));

// Manually set dice to [1,0,0,0]
const s = ctx.state.withDiceValues([1,0,0,0]);
const ctx2 = ctx.withState(s);
const moves = game.moves(ctx2);
console.log('moves with dice [1,0,0,0]:');
for (const m of moves) {
  console.log(`  from=${m.from()} to=${m.to()} mover=${m.mover} isPass=${m.isPass()}`);
}
