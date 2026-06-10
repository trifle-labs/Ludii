// Strict drift detector: replay a recorded Java trial in BOTH engines (faithful + bespoke)
// and compare the FULL legal-move sets at every ply. The parity harness only checks the
// replayed move is PRESENT, so side-effect divergence (captures/pushes applied differently)
// drifts the board silently; this pinpoints the first drifting ply.
//   node probe-replay-diff.mjs "<GameName>" [maxPlies]
// Requires the bespoke engine to replay the trial correctly (it is the Java-correct reference).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const GAME = process.argv[2];
const MAX = parseInt(process.argv[3] ?? "400", 10);
if (!GAME) { console.log("usage: node probe-replay-diff.mjs <GameName> [maxPlies]"); process.exit(1); }

const worker = (useArg) => {
  const code = `
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parseTrial } from './test/parity/trial-format.mjs';
import { findMatchingMove } from './test/parity/move-match.mjs';
const lroot='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud';
const idx=new Map();(function w(d){for(const e of readdirSync(d)){const p=join(d,e);const s=statSync(p);if(s.isDirectory())w(p);else if(e.endsWith('.lud'))idx.set(e.toLowerCase(),p);}})(lroot);
const rs=n=>{const m=idx.get(n.toLowerCase()+'.lud');return m?readFileSync(m,'utf8'):null;};
// find the trial file
const troot='/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials';
let trialPath=null;(function w(d){for(const e of readdirSync(d)){const p=join(d,e);const s=statSync(p);if(s.isDirectory()){ if(e.toLowerCase()===${JSON.stringify(GAME.toLowerCase())}){ const fs=readdirSync(p).filter(f=>f.endsWith('.txt')); if(fs.length){trialPath=join(p,fs[0]);return;} } w(p); if(trialPath)return; }}})(troot);
if(!trialPath){ console.log(JSON.stringify({error:'trial not found'})); process.exit(0); }
const trial=parseTrial(readFileSync(trialPath,'utf8'), trialPath);
const engine=await import('./dist/src/index.js');
const g=engine.play1to1(rs(${JSON.stringify(GAME)}),{resolveSubgame:rs});
let ctx=g.start();
// Skip the recorded setup block exactly like the harness (replay-trials.mjs replayFrom logic):
// explicit numInitialPlacementMoves, else the contiguous leading mover=0 block.
let replayFrom = trial.numInitialPlacementMoves > 0 ? trial.numInitialPlacementMoves : 0;
if (replayFrom === 0) while (replayFrom < trial.moves.length && trial.moves[replayFrom].mover === 0) replayFrom++;
const gameMoves = trial.moves.slice(replayFrom);
// Occupancy snapshot per ply (what + count per site). Move SETS are deliberately
// NOT compared: the bespoke engine over-generates legal moves (membership replay
// tolerates it), so full-set diffs vs bespoke are noise. The honest drift signal
// is the BOARD STATE after each applied recorded move.
const occ=()=>{const r=[];for(let i=0;i<200;i++){let w=0;try{w=ctx.state.whatAtSite(i);}catch{break;}if(w){let c=1;try{c=ctx.state.countAtSite(i)??1;}catch{}r.push(i+':'+w+(c>1?'x'+c:''));}}
  // player values are game state too ((set Value P2 …) drives e.g. El Perro's goat reversal)
  for(let p=1;p<=4;p++){try{const v=ctx.state.valuePlayer(p);if(v!==-1&&v!==undefined)r.push('v'+p+'='+v);}catch{}}
  return r.join(' ');};
const out=[];
for (let i=0;i<Math.min(gameMoves.length, ${MAX});i++){
  const rec=gameMoves[i];
  const ts=g.moves(ctx);
  const match = findMatchingMove(ts, rec);
  if (!match){ out.push('NO_MATCH at ply '+i+' rec='+rec.mover+':'+rec.from+'>'+rec.to); break; }
  ctx=g.apply(ctx, match);
  out.push('after ply '+i+' ('+rec.mover+':'+rec.from+'>'+rec.to+'): '+occ());
}
console.log(JSON.stringify({sets: out}));
`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code],
    { cwd: process.cwd(), env: { ...process.env, LUDII_ARGCOMPILER: useArg ? "1" : "" }, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: 180000 });
  if (r.status !== 0) return { error: (r.stderr || "").split("\n").filter(Boolean).slice(-3).join(" | ") };
  try { return JSON.parse(r.stdout.trim().split("\n").pop()); } catch { return { error: "parse:" + (r.stdout || "").slice(-150) }; }
};

const b = worker(false);
if (b.error) { console.log("bespoke errored:", b.error); process.exit(1); }
const f = worker(true);
if (f.error) { console.log("faithful errored:", f.error); process.exit(1); }

const n = Math.min(b.sets.length, f.sets.length);
for (let i = 0; i < n; i++) {
  if (b.sets[i] !== f.sets[i]) {
    const bs = new Set(b.sets[i].split(" ")), fs = new Set(f.sets[i].split(" "));
    const missing = [...bs].filter((x) => !fs.has(x)), extra = [...fs].filter((x) => !bs.has(x));
    console.log(`FIRST STATE DIVERGENCE at ply ${i}:`);
    console.log(`  bespoke : ${b.sets[i]}`);
    console.log(`  faithful: ${f.sets[i]}`);
    console.log(`  only in bespoke : ${missing.slice(0, 10).join(" ")} (${missing.length})`);
    console.log(`  only in faithful: ${extra.slice(0, 10).join(" ")} (${extra.length})`);
    process.exit(2);
  }
}
console.log(`states identical for ${n} plies (bespoke ${b.sets.length}, faithful ${f.sets.length})`);
