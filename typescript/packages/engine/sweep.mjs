import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLudemeSource } from "./dist/src/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const LUD = join(ROOT, "Common", "res", "lud");

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".lud")) out.push(p);
  }
  return out;
}

const files = walk(LUD, []);
let ok = 0;
let fail = 0;
const buckets = new Map();
const grepArg = process.argv.find((a) => a.startsWith("--grep="));
const grepRe = grepArg ? new RegExp(grepArg.slice("--grep=".length)) : null;
const matched = [];

for (const f of files) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  try {
    compileLudemeSource(src);
    ok += 1;
  } catch (e) {
    fail += 1;
    const raw = (e && e.message) || String(e);
    if (grepRe && grepRe.test(raw)) matched.push([f.slice(LUD.length + 1), raw]);
    let msg = raw.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, "N").slice(0, 70);
    buckets.set(msg, (buckets.get(msg) ?? 0) + 1);
  }
}

if (grepRe) {
  for (const [f, m] of matched.slice(0, 40)) console.log(`${f}\n    ${m}`);
  console.log(`\n${matched.length} files match /${grepRe.source}/`);
}

const total = ok + fail;
console.log(`compiled ${ok}/${total} (${((ok / total) * 100).toFixed(1)}%)`);

if (process.argv.includes("--buckets")) {
  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  console.log("\nTop failure buckets:");
  for (const [msg, n] of sorted.slice(0, 30)) {
    console.log(`${String(n).padStart(4)}  ${msg}`);
  }
}
