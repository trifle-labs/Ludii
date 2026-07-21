# 1:1 Port Wave — Shared Agent Contract

You are porting Ludii engine ludeme classes from **Java → TypeScript, faithfully 1:1**.
This is a PURE port. The legacy interpreter (`eval/compile.ts`, `lud-compiler.ts`, the old
closure `registry.ts`, and the bespoke `*-game.ts` MVE games) has been **DELETED** — it no
longer exists in the tree. `play1to1` → `compiler1to1` (the faithful 1:1 ludeme-object path)
is now the ONLY engine. Each Java ludeme class becomes one faithful TS class that implements
an `eval(ctx)` and self-registers in the 1:1 registry.

## Paths
- Engine working dir: `/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine`
- Java source root: `/Users/billy/GitHub/trifle-labs/Ludii/Core/src/game`
- TS mirror root: `src/ludemes/game/...` (mirror the Java package path under here)

## The proven pattern (READ THESE FIRST)
1. An existing example: `src/ludemes/game/functions/ints1to1/count/CountMoves1to1.ts`
2. Base interfaces: `src/ludemes/base.ts` — `IntFunction { eval(ctx): number }`,
   `BooleanFunction { eval(ctx): boolean }`, `RegionFunction { eval(ctx): number[] }`.
3. Context API (what you can call in eval): `src/context.ts` — note `ctx.state`,
   `ctx.trial`, `ctx.game`, `ctx.equipment`, and the iterator scratch fields
   `ctx._evalFrom / _evalTo / _evalSite / _evalValue / _evalPlayer`.
4. Registry + helpers exported from `src/compiler1to1.ts` (import what you need to compile
   CHILD arguments): `compileInt1to1(node)`, `compileBool1to1(node, numPlayers)`,
   `compileRegion1to1(node)`, `parseArgs1to1(items)`, `headOf(node)`.
5. Registry registration from `src/ludemes/registry1to1.ts`:
   `registerInt1to1(key, ctor)`, `registerBool1to1(key, ctor)`, `registerRegion1to1(key, ctor)`,
   and `type Compile1to1Env` (`{ numPlayers: number }`).

## Class file shape
```ts
import type { Context } from "<relative>/context.js";
import type { IntFunction } from "<relative>/ludemes/base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "<relative>/ludemes/registry1to1.js";
import { compileInt1to1, parseArgs1to1, headOf } from "<relative>/compiler1to1.js";

export class Abs1to1 implements IntFunction {
  constructor(private readonly a: IntFunction) {}
  /** @java game/functions/ints/math/Abs.java — eval(Context) */
  public eval(ctx: Context): number {
    return Math.abs(this.a.eval(ctx)); // mirror Java eval line-by-line
  }
}

// factory parses the .lud node + compiles child args, then constructs the class
registerInt1to1("abs", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1(node.items);
  return new Abs1to1(compileInt1to1(positional[0]));
});
```
NOTE: imports use `.js` extensions (NodeNext ESM), even though source is `.ts`.

## Registry KEY format (must match how compiler1to1 looks keys up)
- **Int**: plain head lowercased (`"abs"`, `"+"`, `"mover"`, `"score"`); compounds
  `count:<sub>`, `size:<sub>`, `value:<sub>`, `last:<sub>` (sub = first positional ident, lowercased).
- **Bool**: plain head (`"and"`, `"not"`); compounds `is:<sub>`, `no:<sub>`, `all:<sub>`, `can`, `was`.
- **Region**: plain head (`"intersection"`, `"union"`, `"difference"`, `"expand"`, `"forEach"`);
  compound `sites:<sub>` for `(sites Empty)`, `(sites Occupied ...)`, etc.

## HARD RULES (enforced at gate; violations get the whole slice reverted)
1. **FAITHFUL to Java.** Open the Java file, mirror its `eval` logic line-by-line. Cite
   `// @java <relative java path>` on the class and on eval.
2. **NO stubs. NO catch-alls.** If you cannot port a class faithfully (missing Context API,
   missing dependency), DO NOT register it and DO NOT return a fake value — leave it out and
   list it in your report under "deferred". A registered key that returns a wrong/placeholder
   value is worse than an unregistered key (which errors visibly).
3. **Do NOT re-register a key already in the exclusion list** I give you — you would clobber a
   working class. Only ADD new keys (fill gaps).
4. **Touch ONLY**: new class files under your assigned subtree, and YOUR OWN barrel file
   (named exactly as I tell you). NEVER edit `compiler1to1.ts`, `registry1to1.ts`, the type
   barrels (`registry1to1-int.ts` etc.), the interpreter, or another agent's files.
5. **It MUST COMPILE.** Run `npx tsc -p tsconfig.json 2>&1 | head -40` from the engine dir and
   fix every error in YOUR files before reporting done. If the only way to make it compile is a
   stub, defer the class instead.
6. Do NOT git commit.

## Your barrel file
Create one barrel file (path I specify) that imports every class file you created, so they
self-register at load. Example contents:
```ts
import "./game/functions/ints/math/Abs1to1.js";
import "./game/functions/ints/math/Add1to1.js";
export {};
```

## NEW function kinds (wave 2+)
`src/ludemes/base.ts` now also defines: `IntArrayFunction { eval(ctx): number[] }`,
`FloatFunction { eval(ctx): number }`, `DirectionsFunction { eval(ctx): string[] }`
(returns Trajectories direction NAMES). Register via `registerIntArray1to1`/
`registerFloat1to1`/`registerDirections1to1` from `registry1to1.js`. Sub-compilers
exported from `compiler1to1.js`: `compileIntArray1to1`, `compileFloat1to1`,
`compileDirections1to1`, and `compileMoves1to1(node, equipment?)` (now exported).

## The REAL topology API (use this — do NOT defer claiming "no topology API")
The board graph IS built. In the 1:1 path get it via the trajectories on the board.
A `Trajectories` object exposes (see `src/eval/graph/trajectories.ts`): `numSites`,
`vertexCount`, `kind`, `perimeterSites()`, `cornerSites()` (vertex-play), `xOf/yOf/zOf(site)`,
`edgeEndpoints(site)`, `step(site,dir)`, `steps(site,dir)`, `ray(site,dir)`,
`group(site,name)`, `neighbours(site)`, `radialsByName(site,dirName)`,
`distinctRadialsByName(site,dirName)`, `walkSites(from,walks,allRotations)`.
Flat per-cell radials are on `ctx._radials` (`CellFlatRadials[]`, each `{axes:{ray,opposite}[]}`)
and the graph trajectories on `ctx._trajectories` (may be null for plain square lattices —
in that case use `ctx._radials` and board width/height from `ctx.game`).
`ctx.game` is a `Game1to1` with `.width/.height/.numSites/.equipment`. So edge/vertex/
adjacency/corner/distance ludemes ARE portable — call these. Only defer if the SPECIFIC
datum truly has no source (e.g. domino pip metadata on components).

## Report back (concise)
- # classes ported faithfully + the registry keys you added.
- Which Java files you DEFERRED and why (missing API/dep) — be honest, do not hide gaps.
- Confirm: built clean (`tsc` exit 0), touched only your subtree + your barrel, no edits to
  compiler1to1.ts / interpreter / other barrels.
- Your barrel file path.
