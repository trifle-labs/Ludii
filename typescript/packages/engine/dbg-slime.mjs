import { readFileSync } from 'node:fs';
const { compileLudemeSource } = await import('./dist/src/index.js');
const LUD = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/blocking/Slimetrail.lud';
const game = compileLudemeSource(readFileSync(LUD, 'utf8'));
const ctx = game.start();
console.log('numSites=', game.numSites, 'mover=', ctx.state.mover);
// find occupied sites
const occ=[]; for(let s=0;s<game.numSites;s++){const w=ctx.state.whatAtSite?ctx.state.whatAtSite(s):ctx.state.cells[s]; if(w) occ.push(s+':'+w);}
console.log('occupied:', occ.join(','));
const moves = game.moves(ctx);
console.log('moveCount=', moves.length);
for(const m of moves.slice(0,10)) console.log('  ', m.from(), '->', m.to(), 'pass='+(m.isPass&&m.isPass()));
