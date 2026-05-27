import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileLudemeSource } from "./dist/src/index.js";
const root = "/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud";
const files = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (e.endsWith(".lud")) files.push(p);
  }
};
walk(root);
const tile = new Map();
for (const f of files) {
  try {
    compileLudemeSource(readFileSync(f, "utf8"));
  } catch (e) {
    const m = /unsupported board tiling "([^"]*)"/.exec(e.message || "");
    if (m) tile.set(m[1], (tile.get(m[1]) || 0) + 1);
  }
}
const sorted = [...tile.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, v] of sorted) console.log(String(v).padStart(5), k);
