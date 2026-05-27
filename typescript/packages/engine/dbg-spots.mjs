import { readFileSync, readdirSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const eng = await import('./dist/src/index.js');
const { compileLudemeSource } = eng;
const COMMON = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/blocking';
const TRIALS = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/space/blocking';
const g = 'Spots';
const game = compileLudemeSource(readFileSync(`${COMMON}/${g}.lud`, 'utf8'));
const tdir = `${TRIALS}/${g}`;
const tf = readdirSync(tdir).find(f => f.startsWith('RandomTrial'));
const trial = parseTrial(readFileSync(`${tdir}/${tf}`, 'utf8'));
let ctx = game.start();
const rm = trial.moves; let from=0; while(from<rm.length&&rm[from].mover===0)from++;
const gm = rm.slice(from);
for (const rec of gm){ if(game.over(ctx))break; const mv=game.moves(ctx); let m=mv.find(x=>x.to()===rec.to); if(!m)break; ctx=game.apply(ctx,m);}
const st=ctx.state;
let occ=[]; for(let s=0;s<game.numSites;s++){const w=st.whats?.[s]??0; const o=st.cells?.[s]??0; if(w||o) occ.push(`${s}:what=${w},own=${o}`);}
console.log('occupied:', occ.length);
console.log(occ.join('  '));
console.log('mover at final =', st.mover);
