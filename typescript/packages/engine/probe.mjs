import { readFileSync } from "node:fs";
import { compileLudemeSource } from "./dist/src/index.js";
const src = readFileSync(process.argv[2], "utf8");
try {
  const g = compileLudemeSource(src);
  const ctx = g.start();
  console.log("OK", g.name, "sites", g.numSites, "moves", g.moves(ctx).length);
} catch (e) { console.log("FAIL:", e.message); }
