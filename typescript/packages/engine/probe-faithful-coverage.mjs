// Corpus-wide FAITHFUL-PATH compile coverage: for each .lud, does the ArgCompiler produce
// a faithful game (equip=Equipment) or throw (-> bespoke fallback)? No play — compile only.
//   node probe-faithful-coverage.mjs [stride=10] [limit=Infinity]
// Reports faithful%, fallback reasons histogram, and writes the per-game list to
// test/parity/faithful-coverage.json for diffing between waves.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const STRIDE = parseInt(process.argv[2] ?? "10", 10);
const LIMIT = parseInt(process.argv[3] ?? "100000", 10);

const lang = await import("@ludii/typescript-language");
const { ArgCompiler } = await import("./dist/src/ludii/compiler/arg/ArgCompiler.js");
const { getBuiltinDefines } = await import("./dist/src/builtin-defines.js");
const { expandRanges, expandSiteRanges } = await import("./dist/src/lud-ranges.js");
const { expandDefines } = await import("./dist/src/lud-defines.js");
const { applyOptions } = await import("./dist/src/lud-options.js");

const root = "/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud";
const files = [];
(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else if (e.endsWith(".lud")) files.push(p); } })(root);
files.sort();

const ac = new ArgCompiler();
let faithful = 0, fallback = 0, total = 0;
const reasons = new Map();
const perGame = [];

for (let i = 0; i < files.length && total < LIMIT; i += STRIDE) {
  const f = files[i];
  total++;
  let status, reason = "";
  try {
    const ast = expandDefines(applyOptions(lang.parseLud(expandSiteRanges(expandRanges(readFileSync(f, "utf8"))))), [...getBuiltinDefines()]);
    const g = ac.compile(ast, ["game.Game"]);
    const equip = g?.equipment?.constructor?.name ?? "?";
    if (equip === "Equipment") { status = "FAITHFUL"; faithful++; }
    else { status = "FALLBACK_EQUIP"; reason = `equip=${equip}`; fallback++; }
  } catch (e) {
    status = "THROW";
    reason = String(e?.message ?? e).slice(0, 90);
    fallback++;
  }
  if (reason) reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  perGame.push({ game: relative(root, f), status, reason });
}

console.log(`FAITHFUL-COMPILE COVERAGE: ${faithful}/${total} (${(100 * faithful / total).toFixed(1)}%) — fallback ${fallback}`);
console.log("--- top fallback reasons ---");
[...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([r, n]) => console.log(`  ${String(n).padStart(4)}  ${r}`));
writeFileSync("test/parity/faithful-coverage.json", JSON.stringify({ faithful, fallback, total, perGame }, null, 1));
console.log("wrote test/parity/faithful-coverage.json");
