// End-to-end acceptance test for the faithful create() pass (Task #13).
// Run AFTER `npm run build`:  node probe-play.mjs
//
// Loads Breakthrough via the faithful ArgCompiler path (LUDII_ARGCOMPILER=1) and
// asserts the faithful path PLAYS it like the bespoke path does:
//   - the game compiles WITHOUT falling back to bespoke (faithful Equipment used),
//   - 64-site board, 32 pieces placed at start,
//   - P1's first move list has the ~22 Breakthrough opening moves.
//
// SUCCESS = prints a line starting with "OK:" and exits 0.
// FAILURE = prints "FAIL:" / throws and exits non-zero.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

process.env.LUDII_ARGCOMPILER = "1";
const engine = await import("./dist/src/index.js");

const root = "/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud";
const idx = new Map();
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (e.endsWith(".lud")) idx.set(e.toLowerCase(), p);
  }
})(root);
const rs = (n) => { const m = idx.get(n.toLowerCase() + ".lud"); return m ? readFileSync(m, "utf8") : null; };

let game;
try {
  game = engine.play1to1(rs("Breakthrough"), { resolveSubgame: rs });
} catch (e) {
  console.log("FAIL: play1to1 threw:", e?.message);
  process.exit(1);
}

// The faithful Equipment must be used (NOT the bespoke registry Equipment1to1 fallback).
const equipName = game?.equipment?.constructor?.name;
if (equipName !== "Equipment") {
  console.log(`FAIL: expected faithful Equipment, got ${equipName} (ArgCompiler fell back to bespoke)`);
  process.exit(1);
}

const numSites = game?.equipment?.board?.numSites ?? game?.equipment?.board?.getNumSites?.();
if (numSites !== 64) { console.log(`FAIL: expected 64 board sites, got ${numSites}`); process.exit(1); }

const ctx = game.start();
const st = ctx.state;
let placed = 0;
for (let i = 0; i < st.cells.length; i++) if (st.cells[i]) placed++;
if (placed !== 32) { console.log(`FAIL: expected 32 pieces placed at start, got ${placed}`); process.exit(1); }

const moves = game.moves(ctx);
const real = moves.filter((m) => !m.isPass?.());
if (real.length < 20) {
  console.log(`FAIL: expected ~22 P1 opening moves, got ${real.length} real moves (${moves.length} total)`);
  process.exit(1);
}

console.log(`OK: faithful Breakthrough plays. equip=${equipName}, sites=${numSites}, placed=${placed}, moves=${real.length}`);
process.exit(0);
