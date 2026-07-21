# Faithful ArgClass-based compiler — build spec

## Why
The current `src/ludii/compiler/Compiler.ts` matches `.lud` args by grammar-symbol
NAME + bespoke per-class factories — a lossy approximation that plateaus (~36%).
Java's real compiler (`Language/src/compiler/ArgClass.java`) matches by TYPE via
reflection: filter candidate classes by `expected.isAssignableFrom(cls)`, try each
class's static `construct()` methods then constructors, match parsed args to the
executable's PARAMETER TYPES recursively, `newInstance`. Reproduce THAT exactly —
no heuristics, no new logic. Java is the oracle (it compiles every game).

## Foundation already captured (do not rebuild)
- `tools/parity/ludeme-reflection.json` — every ludeme class → `assignableTo`
  (supertypes for isAssignableFrom) + `executables` (constructors and static
  `construct` methods, each with ordered `params`: `{type, array, ann[]}` where
  ann ∈ Opt/Name/Or/Or2/And/And2). Captured from Java reflection (DumpReflection.java).
- `src/ludii/compiler/gen/java-ts-ctors.ts` — `JAVA_TS_CTORS: Map<javaClassName, TSctor>`
  (663 ludeme classes → live TS constructor). Use to instantiate.
- `tools/parity/java-grammar-current.txt` via `ebnf-grammar-loader.ts` — token → symbols.
- Java oracle: `/opt/homebrew/opt/openjdk@21/bin/java -cp <all */bin + Common/lib/*.jar + Player/lib/xmlgraphics-commons-2.3.jar> parity.DumpReflection` etc.; `other.GameLoader.loadGameFromFile` compiles a game. Use to compare resolution when stuck.

## Build (src/ludii/compiler/arg/ArgCompiler.ts)
Port `ArgClass.compile()` + `Arg.compile()`/`ArgTerminal` faithfully:
1. `compile(node, expectedJavaTypes: string[], env)`:
   - TERMINALS: if an expected type is `int`/`java.lang.Integer`→number, `boolean`/`java.lang.Boolean`→bool, `float`→number, `java.lang.String`→string; enums (`game.types.*`) → the enum value (reuse existing enum handling). Numbers/strings/idents handled as in ArgTerminal.java.
   - LIST node `{...}` → compile each element against the array component type.
   - Otherwise resolve candidate Java classes for `node`'s head keyword (token) via the reflection metadata token field (and/or grammar). Keep candidates whose `assignableTo` intersects `expectedJavaTypes`.
   - For each candidate class, for kind in [construct, constructor] (construct FIRST, per ArgClass): for each executable of that kind, attempt to bind the node's parsed args (positional + `name:` named, respecting @Opt optionality and @Or/@Or2 mutually-exclusive groups) to the executable's `params` by recursively `compile`-ing each arg node against that param's `type` (single expected type). If all required params bind, INSTANTIATE: constructor → `new (JAVA_TS_CTORS.get(className))(...orderedArgs)`; construct → call the TS class's static `construct(...)`. Return the object. Faithfully mirror ArgClass.java's binding/backtracking.
2. `compileGame(source)`: front-end `parseLud`→`applyOptions`→`expandDefines` (reuse), then `compile(gameNode, ["game.Game"], env)`.

## Prove + drive
- TTT: compile `Common/res/lud/board/space/line/Tic-Tac-Toe.lud` via ArgCompiler; assert ply-0 legal moves match the dispatcher (`tools/proof/faithful-ttt-proof.mjs` pattern).
- Then run a coverage proof (clone `tools/proof/faithful-coverage.mjs`, swap in ArgCompiler) over 60 games; iterate on real divergences (use the Java oracle to see how Java resolves a node ArgCompiler fails). Goal: surpass the 36% plateau — because this is faithful, it should climb broadly, not per-case.
- Keep `npx tsc -p tsconfig.json` green. Do NOT touch the old Compiler.ts / play1to1 / compiler1to1.ts yet (additive). No git commit.

## Key faithfulness rules
- The dispatch + arg-binding is DATA-DRIVEN by ludeme-reflection.json (Java's own reflection), NOT by hand-coded per-keyword logic. The only TS-specific glue is instantiation via JAVA_TS_CTORS (because TS lacks reflection) — everything else mirrors ArgClass.java.
- When TS diverges from Java, instrument/inspect Java (it runs) to see its resolution and fix TS to match. Do not invent behavior.

## Update 2026-06-07 (PM): ROOT CAUSE PROVEN — instantiation/constructor drift, not the matcher

Coverage this session: **15% → 32%** (60-game sample), build green. Key findings (empirical):

1. **A static-initializer crash masked everything.** `Common/.../qr_codes/QrSegmentAdvanced.ts` decoded a base64 kanji table with `atob` at module load; Node's `atob` is stricter than Java's Base64 (rejects whitespace) and threw, killing the coverage harness. Fixed (sanitize + guard). 15%→20%.
2. **The deepest-miss diagnostic was lying.** It surfaced benign stale probes (e.g. "array (FR) did not match AbsoluteDirection" — an `@Or` alternative that a sibling combo satisfied) instead of the true blocker. Added `deepestInst` tracker in `ArgCompiler.ts`: when args bind to a Java constructor but the mapped TS class can't be instantiated (ctor-arity drift / no static `construct(n)` / no mapping / ctor throws), that is recorded and OUTRANKS ordinary match-probe `note()`s (and is snapshot/restored in `compileMaybe` like `deepest`). The top failure reasons immediately became real and frequency-ranked.
3. **Therefore the holistic root cause = constructor drift.** The matcher binds args to Java parameter shapes correctly; INSTANTIATION fails because many ported TS classes have bespoke/drifted constructors that don't accept Java's positional args. This is exactly "what needs to be PORTED": faithful Java-positional constructors. Reflection libraries do NOT fix this (they'd reflect the drifted TS ctors); they're a later self-containment/maintenance win.
4. **Proven by targeted fixes:** `Directions1to1Static` ctor → Java's `(@Or AbsoluteDirection, @Or AbsoluteDirection[])` (20%→30%, 11 games); `Array1to1` → single 1-arg ctor matching Java's two 1-arg ctors (30%→32%).

NOTE: coverage = COMPILE coverage (compileGame returns non-null). The int/region **eager-vs-lazy representation seam** (ArgCompiler hands raw numbers where ludemes expect IntFunction objects) is a separate BEHAVIORAL-parity concern, not a compile blocker.

### Frequency-ranked worklist (drive the grind by this; re-run `node tools/proof/argcompiler-coverage.mjs`)
- **12× `game.rules.start.set.Set`** — unmapped; needs static `construct*` dispatchers routing to variants. DEEP: the whole `start/set/*` subsystem is drifted to EAGER ctors (`SetCount1to1(sites:number[], count:number)`) vs Java's lazy `(IntFunction, @Opt SiteType, @Or IntFunction, @Or RegionFunction)`. Re-port subsystem to lazy + add dispatcher.
- **6× `Sites`/`Pieces` → java.lang.String** — `(count Sites in:…)`/`(no Pieces …)`. The CountSiteType/NoPieceType enums ARE dump-flagged; failure is the 8-param `@Opt/@Or/@Or2/@Name` static `construct` on `functions.ints.count.Count` not binding + needing a TS static `construct(8)`. Deep-ish (complex @Or binding + static method).
- **4× `(sites)` as ForEachTeamType**, **2× `(id)` as String** — candidate-resolution dead-ends (verify not stale probes).
- single-class drift fixes (like Directions/Array, usually shallow): `functions.graph.operators.Add` (1≠8), `effect.set.Set` (construct/6), etc.

Sub-agents (workflow + Agent tool, even model:opus) are Sonnet-capped until **Jun 10 3pm**; Codex produces nothing on these complex ports. So bulk parallel constructor re-port resumes Jun 10; solo Opus grinding works now (each fix high-leverage, see numbers).
