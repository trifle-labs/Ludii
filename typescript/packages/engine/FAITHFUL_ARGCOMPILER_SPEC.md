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
