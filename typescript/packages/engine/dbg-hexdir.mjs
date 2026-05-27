import { readFileSync } from 'node:fs';
const eng = await import('./dist/src/index.js');
const { compileLudemeSource } = eng;
const COMMON = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/blocking';
const game = compileLudemeSource(readFileSync(`${COMMON}/Spots.lud`, 'utf8'));
const ctx = game.start();
const board = game.board ?? ctx.board;
const traj = board.traj;
console.log('has traj:', !!traj);
const site = 20;
for (const grp of ['Adjacent','Orthogonal','Diagonal','All']) {
  let r;
  try { r = traj.group(site, grp); } catch(e){ r = 'ERR '+e.message; }
  console.log(`group(${site}, ${grp}) =`, Array.isArray(r)? `[${r.join(',')}]` : r);
}
// also step in compass dirs
console.log('traj methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(traj)).slice(0,30).join(','));
