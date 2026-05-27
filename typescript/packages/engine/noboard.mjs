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
const head = new Map();
for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
    compileLudemeSource(src);
  } catch (e) {
    if (!/equipment has no \(board/.test(e.message || "")) continue;
    // find the board-ish constructor actually present
    const m = /\((\w*[Bb]oard\w*|boardless|mancalaBoard|surakartaBoard)\b/.exec(
      src,
    );
    const key = m ? m[1] : "(none found)";
    head.set(key, (head.get(key) || 0) + 1);
  }
}
const sorted = [...head.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, v] of sorted) console.log(String(v).padStart(5), k);
