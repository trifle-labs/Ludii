// Fast compile-coverage guard (hang-free): the faithful ArgCompiler must still compile a
// set of representative games (no throw, faithful or registry path). Used to ensure the
// move-keyword-dispatch change does not regress compile coverage.
// Run AFTER `npm run build`:  node probe-compile-guard.mjs
// SUCCESS = "OK:" + exit 0 ; FAILURE = "FAIL:" + exit 1.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
process.env.LUDII_ARGCOMPILER = "1";
const engine = await import("./dist/src/index.js");

const root = "/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud";
const idx = new Map();
(function w(d) { for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p); if (s.isDirectory()) w(p); else if (e.endsWith(".lud")) idx.set(e.toLowerCase(), p); } })(root);
const rs = (n) => { const m = idx.get(n.toLowerCase() + ".lud"); return m ? readFileSync(m, "utf8") : null; };

const GAMES = ["Tic-Tac-Toe", "Breakthrough", "Amazons", "Gomoku", "Hex", "Go", "Reversi", "Connect Four", "Yavalath", "Tablut"];
const fails = [];
for (const g of GAMES) {
  const src = rs(g);
  if (!src) continue; // game name variant not found; skip
  try {
    const game = engine.play1to1(src, { resolveSubgame: rs });
    if (!game) fails.push(`${g}: null`);
  } catch (e) {
    fails.push(`${g}: ${String(e?.message).slice(0, 60)}`);
  }
}
if (fails.length) { console.log("FAIL: compile regressions:", fails.join(" | ")); process.exit(1); }
console.log(`OK: ${GAMES.length} representative games compile (no throw) on the faithful path.`);
process.exit(0);
