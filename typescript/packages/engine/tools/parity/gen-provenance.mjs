#!/usr/bin/env node
// Generates java-provenance.tsv: a machine-readable map from every TS symbol
// tagged `// @java <repo-relative-path> [Symbol]` to its Java source, and
// verifies each cited Java path still exists under the Ludii repo root.
//
// Usage: node tools/parity/gen-provenance.mjs
// Exits non-zero if any @java path is stale (upstream move/delete) — wire this
// into CI to catch divergence early. See PROVENANCE.md.

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)); // .../engine/tools/parity
const engineRoot = resolve(here, "..", ".."); // .../packages/engine
const packagesRoot = resolve(engineRoot, ".."); // .../packages
const ludiiRoot = resolve(engineRoot, "..", "..", ".."); // .../Ludii

const srcDirs = [
  resolve(engineRoot, "src"),
  resolve(packagesRoot, "language", "src"),
];

// Matches:  // @java Core/src/.../Foo.java        (symbol optional)
//           // @java (none) — TS-only reason      (no Java counterpart)
const TAG = /\/\/\s*@java\s+(\S+)(?:\s+(.+?))?\s*$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      out.push(...walk(p));
    } else if (p.endsWith(".ts") && !p.endsWith(".d.ts")) {
      out.push(p);
    }
  }
  return out;
}

const rows = [];
const stale = [];
let tsOnly = 0;

for (const dir of srcDirs) {
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const m = TAG.exec(line);
      if (!m) return;
      const javaPath = m[1];
      const symbol = (m[2] ?? "").trim();
      const tsRel = `${relative(ludiiRoot, file)}:${i + 1}`;
      if (javaPath === "(none)") {
        tsOnly += 1;
        rows.push({ ts: tsRel, java: "(none)", symbol, exists: "n/a" });
        return;
      }
      const exists = existsSync(resolve(ludiiRoot, javaPath));
      rows.push({ ts: tsRel, java: javaPath, symbol, exists: String(exists) });
      if (!exists) stale.push({ ts: tsRel, java: javaPath });
    });
  }
}

rows.sort((a, b) => a.java.localeCompare(b.java) || a.ts.localeCompare(b.ts));
const tsv = [
  "ts_location\tjava_path\tsymbol\tjava_exists",
  ...rows.map((r) => `${r.ts}\t${r.java}\t${r.symbol}\t${r.exists}`),
].join("\n");
const outPath = resolve(engineRoot, "java-provenance.tsv");
writeFileSync(outPath, `${tsv}\n`);

console.log(`Wrote ${relative(ludiiRoot, outPath)}`);
console.log(`Tagged references: ${rows.length} (TS-only: ${tsOnly})`);
if (stale.length > 0) {
  console.log(`\nSTALE @java references (Java path no longer exists): ${stale.length}`);
  for (const s of stale) console.log(`  ${s.ts} -> ${s.java}`);
  process.exitCode = 1;
} else {
  console.log("All @java references resolve to existing Java files.");
}
