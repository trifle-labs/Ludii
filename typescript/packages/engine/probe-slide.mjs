// Acceptance test for the faithful Slide move-dispatch wave.
// Validates faithful (move Slide ...) against the bespoke reference (which plays Amazons
// correctly). Amazons' first move (even ply) = forEach Piece queen SLIDES.
// Uses separate child processes per engine mode (clean env — no in-process interference).
// Run AFTER `npm run build`:  node probe-slide.mjs
// SUCCESS = "OK:" + exit 0 ; FAILURE = "FAIL:" + exit 1.

import { spawnSync } from "node:child_process";

const GAME = "Amazons";
const worker = (useArg) => {
  const code = `
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud';
const idx=new Map();(function w(d){for(const e of readdirSync(d)){const p=join(d,e);const s=statSync(p);if(s.isDirectory())w(p);else if(e.endsWith('.lud'))idx.set(e.toLowerCase(),p);}})(root);
const rs=n=>{const m=idx.get(n.toLowerCase()+'.lud');return m?readFileSync(m,'utf8'):null;};
const engine=await import('./dist/src/index.js');
const g=engine.play1to1(rs(${JSON.stringify(GAME)}),{resolveSubgame:rs});
const ctx=g.start();
const mv=g.moves(ctx).filter(m=>!m.isPass?.());
const set=mv.map(m=>m.from?.()+'->'+m.to?.());
process.stdout.write(JSON.stringify({equip:g?.equipment?.constructor?.name,count:mv.length,set}));
`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: process.cwd(),
    env: { ...process.env, LUDII_ARGCOMPILER: useArg ? "1" : "", LUDII_BESPOKE: useArg ? "" : "1" },
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) return { error: (r.stderr || "").split("\n").filter(Boolean).slice(-4).join(" | ") };
  try { return JSON.parse(r.stdout.trim().split("\n").pop()); } catch { return { error: "parse: " + r.stdout.slice(-200) }; }
};

const bespoke = worker(false);
if (bespoke.error) { console.log("FAIL: bespoke reference run errored:", bespoke.error); process.exit(1); }
const faithful = worker(true);
if (faithful.error) { console.log("FAIL: faithful run errored:", faithful.error); process.exit(1); }

if (faithful.equip !== "Equipment") {
  console.log(`FAIL: faithful path not used (equip=${faithful.equip}); (move Slide ...) still falls back to bespoke`);
  process.exit(1);
}
const bSet = new Set(bespoke.set), fSet = new Set(faithful.set);
const missing = [...bSet].filter((m) => !fSet.has(m));
const extra = [...fSet].filter((m) => !bSet.has(m));
if (missing.length || extra.length) {
  console.log(`FAIL: faithful Slide diverges from bespoke. bespoke=${bespoke.count} faithful=${faithful.count}`);
  console.log(`  missing: ${missing.slice(0, 8).join(", ")} (${missing.length}); extra: ${extra.slice(0, 8).join(", ")} (${extra.length})`);
  process.exit(1);
}
console.log(`OK: faithful Slide matches bespoke on ${GAME}. equip=${faithful.equip}, moves=${faithful.count} (identical sets)`);
process.exit(0);
