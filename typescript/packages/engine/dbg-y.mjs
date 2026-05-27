import { readFileSync } from 'node:fs';
import { parseTrial } from './test/parity/trial-format.mjs';
const eng = await import('./dist/src/index.js');
const { compileLudemeSource } = eng;

const LUD = '/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/space/connection/Y.lud';
const TRL = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials/board/space/connection/Y/RandomTrial_0.txt';

const src = readFileSync(LUD, 'utf8');
const game = compileLudemeSource(src);
let ctx = game.start();

// Inspect board sides
const board = game.board ?? ctx.board;
console.log('numSites=', game.numSites);
const sr = (ctx.board && ctx.board.sideRegions) || (board && board.sideRegions);
console.log('sideRegions keys:', sr ? Object.keys(sr) : 'NONE');
if (sr) for (const k of Object.keys(sr)) console.log('  side', k, 'size', sr[k].length, 'sample', sr[k].slice(0,6));

// Replay the recorded trial fully
const trialText = readFileSync(TRL, 'utf8');
const trial = parseTrial(trialText);
const recMoves = trial.moves;
console.log('\nrecorded winner =', trial.winner, ' #moves=', recMoves.length);

let replayFrom = 0;
while (replayFrom < recMoves.length && recMoves[replayFrom].mover === 0) replayFrom++;
const gameMoves = recMoves.slice(replayFrom);

let ply = 0;
for (const rec of gameMoves) {
  if (game.over(ctx)) break;
  const tsMoves = game.moves(ctx);
  // crude match by from/to
  let m = tsMoves.find(mv => mv.from() === rec.from && mv.to() === rec.to);
  if (!m) m = tsMoves.find(mv => mv.to() === rec.to);
  if (!m) { console.log('NO MATCH at ply', ply, 'rec from/to', rec.from, rec.to, 'tsMoves', tsMoves.length); break; }
  ctx = game.apply(ctx, m);
  ply++;
}
console.log('replayed plies =', ply, '/', gameMoves.length);
console.log('game.over(ctx) =', game.over(ctx));
console.log('ctx.winner =', ctx.winner, ' ctx.trial.winner =', ctx.trial?.winner);

// occupied cells by owner
const st = ctx.state;
const byOwner = {};
for (let s=0;s<game.numSites;s++){ const o = st.cells?.[s]??0; if(o){ (byOwner[o]??=[]).push(s);} }
for (const o of Object.keys(byOwner)) console.log('owner', o, 'count', byOwner[o].length);
