import { readFileSync } from 'node:fs';
import { compileLudemeSource } from './dist/src/index.js';
const abs='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/race/reach/Murus Gallicus.lud';
const game=compileLudemeSource(readFileSync(abs,'utf8'));
const ctx=game.start();
for(const p of game.placements){
  const reg=p.region;
  let sites='(no eval)';
  try{ sites=JSON.stringify(reg.eval ? reg.eval(ctx) : reg); }catch(e){sites='ERR '+e.message;}
  console.log(`owner=${p.owner} what=${p.what} count=${p.count} -> sites=${sites}`);
}
