// Parameterized acceptance test: faithful vs bespoke first-move parity for a given game.
//   node probe-game.mjs "<GameName>" [maxApplyPlies]
// Asserts (1) the faithful path is actually used (equip=Equipment, not bespoke fallback) and
// (2) the faithful first-move set equals the bespoke reference set (bespoke = validated ~60% engine).
// Optionally replays maxApplyPlies bespoke moves and re-checks the move set at each, to exercise
// more than the opening position. Separate child processes per engine mode (clean env).
// SUCCESS = "OK:" + exit 0 ; FAILURE = "FAIL:" + exit 1.

import { spawnSync } from "node:child_process";

const GAME = process.argv[2];
const PLIES = Math.max(1, parseInt(process.argv[3] ?? "1", 10));
if (!GAME) { console.log("FAIL: usage: node probe-game.mjs <GameName> [plies]"); process.exit(1); }

const worker = (useArg) => {
  const code = `
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud';
const idx=new Map();(function w(d){for(const e of readdirSync(d)){const p=join(d,e);const s=statSync(p);if(s.isDirectory())w(p);else if(e.endsWith('.lud'))idx.set(e.toLowerCase(),p);}})(root);
const rs=n=>{const m=idx.get(n.toLowerCase()+'.lud');return m?readFileSync(m,'utf8'):null;};
const engine=await import('./dist/src/index.js');
const g=engine.play1to1(rs(${JSON.stringify(GAME)}),{resolveSubgame:rs});
let ctx=g.start();
const sets=[];
for (let i=0;i<${PLIES};i++){
  if (ctx.trial?.over || ctx.over) break;            // stop at game-over (not a divergence)
  const all=g.moves(ctx);
  const mv=all.filter(m=>!m.isPass?.());
  sets.push(mv.map(m=>m.from?.()+'->'+m.to?.()).sort());
  if(all.length===0) break;
  ctx=g.apply(ctx, all[0]);                            // apply first legal move (incl. pass) to advance
}
process.stdout.write(JSON.stringify({equip:g?.equipment?.constructor?.name, sets}));
`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code],
    { cwd: process.cwd(), env: { ...process.env, LUDII_ARGCOMPILER: useArg ? "1" : "" }, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, timeout: 60000 });
  if (r.status !== 0) return { error: (r.stderr || "").split("\n").filter(Boolean).slice(-4).join(" | ") };
  try { return JSON.parse(r.stdout.trim().split("\n").pop()); } catch { return { error: "parse: " + (r.stdout || "").slice(-200) }; }
};

const bespoke = worker(false);
if (bespoke.error) { console.log(`FAIL: bespoke reference errored: ${bespoke.error}`); process.exit(1); }
const faithful = worker(true);
if (faithful.error) { console.log(`FAIL: faithful run errored: ${faithful.error}`); process.exit(1); }
if (faithful.equip !== "Equipment") { console.log(`FAIL: faithful path not used (equip=${faithful.equip})`); process.exit(1); }

const n = Math.min(bespoke.sets.length, faithful.sets.length);
for (let i = 0; i < n; i++) {
  const b = new Set(bespoke.sets[i]), f = new Set(faithful.sets[i]);
  const missing = [...b].filter((m) => !f.has(m)), extra = [...f].filter((m) => !b.has(m));
  if (missing.length || extra.length) {
    console.log(`FAIL: ${GAME} ply ${i}: faithful diverges (bespoke=${b.size} faithful=${f.size})`);
    console.log(`  missing: ${missing.slice(0, 8).join(", ")} (${missing.length}); extra: ${extra.slice(0, 8).join(", ")} (${extra.length})`);
    process.exit(1);
  }
}
console.log(`OK: faithful == bespoke on ${GAME} for ${n} ply (equip=Equipment, opening ${faithful.sets[0]?.length} moves)`);
process.exit(0);
