# Faithful grammar-driven Compiler — build spec

Goal: replace the bespoke `src/compiler1to1.ts` dispatcher (a hand-coded
`if (h === "...")` switch — NOT a port of any Java file) with a faithful port of
Java's real `.lud` compilation path (`Language/src/compiler/Compiler.java` +
`Arg/ArgClass/ArgTerminal` + the grammar), so that `.lud` compiles the way Java
compiles it. End state: `play1to1` calls the faithful `Compiler`, and
`compiler1to1.ts` is deleted.

## Why a substrate is needed
Java instantiates ludemes by reflection: `Compiler` parses `.lud` → tokens,
looks each symbol up in the `Grammar`, then `ArgClass` matches the parsed args to
a class constructor's parameter types (guided by `@Opt`/`@Name`/`@Or`) and
`newInstance()`s it. TS has no runtime constructor reflection. We replace it with:
- **Grammar from EBNF** (already built): `src/ludii/Language/src/grammar/ebnf-grammar-loader.ts`
  `parseEbnfGrammar(text)` → `GrammarModel` (Map symbol → {clauses:[{keyword|alias, args:[{symbol,optional,list,name,orGroup}]}]}).
  Load `tools/parity/java-grammar-current.txt`. 376 symbols / 490 keyword clauses.
- **Constructor-factory registry** (the reflection substitute): one factory per
  ludeme keyword that maps a matched, arg-resolved clause to its TS constructor.

## Compilation pipeline (faithful)
Front-end already exists and is reused verbatim:
`parseLud` (@ludii/typescript-language) → `expandDefines` (`src/lud-defines.ts`)
→ `applyOptions` (`src/lud-options.ts`). Do NOT rebuild these.

New back-end (this work):
1. `Compiler.compile(luddAst, grammar, registry, env)` walks the option-applied
   `(game ...)` AST top-down. For each list node `(keyword arg...)`:
   a. Resolve the grammar symbol for `keyword` in the expected arg position
      (the parent clause's arg `symbol` constrains which rule applies; e.g. an
      arg typed `<moves.to>` expects a `to`-family keyword).
   b. Find the matching `GrammarClause` (by keyword + arg arity/shape; respect
      `optional`, `list`, `name:` (named args appear as `name:value` or
      `(name value)` in the AST per Ludii), and `orGroup` alternatives).
   c. Recursively compile each child arg to its TS value (a ludeme instance,
      primitive, enum, or array).
   d. Build an `ArgBundle { positional: any[]; named: Map<string, any>; type?: SiteType }`
      and call `registry.construct(keyword, clauseIndex, bundle, env)`.
2. Terminals: `<int>`/`<dim>`→number, `<string>`→string, `<boolean>`→bool fn,
   enums (`<roleType>`, `<siteType>`, …)→the ported enum value. `ArgTerminal.ts`
   already models terminal parsing — make it functional.

## Factory convention (what the 490 factories look like — for parallel authoring)
Each ludeme keyword registers ONE factory mirroring its Java class constructor(s):
```ts
// @java Core/src/game/rules/play/moves/nonDecision/effect/Hop.java
registerLudeme("hop", (b: ArgBundle, env): Moves => {
  // map the grammar-matched args to the Java constructor, faithfully:
  //   Hop(SiteType, From, Direction, Between, To, Boolean stack, Then)
  const from = b.named.get("from") ?? b.positional.find(isFrom) ?? null;
  ...
  return new Hop(type, from, dirn, between, to, stack, then);
});
```
- The factory's argument-to-constructor mapping is derived from the class's Java
  constructor signature + its `@Opt/@Name/@Or` annotations (read the .java).
- Reuse the already-ported faithful ludeme classes in `src/ludemes/...`. Do NOT
  reimplement their logic — only construct them.
- Factories live one-per-file next to a barrel (e.g. `src/ludii/compiler/factories/<area>/*.ts`)
  so they can be authored in parallel without edit conflicts.

## THIS TASK (core + proof, single coherent unit)
1. Implement `src/ludii/compiler/Compiler.ts` (faithful to `Language/src/compiler/Compiler.java`'s
   `compile`/`compileActual` structure) using `parseEbnfGrammar` + the front-end above.
2. Implement the `ArgBundle`, the grammar-clause matcher, terminal handling, and a
   `LudemeRegistry` (`registerLudeme`/`construct`).
3. Seed factories for ONLY the ludemes Tic-Tac-Toe needs (game, players, equipment,
   board, square tiling, piece, rules, play, moves forEach/Add/to (sites Empty),
   end (if is Line → result Win), etc. — inspect `Common/res/lud/board/space/line/Tic-Tac-Toe.lud`).
4. Prove it: a node script that compiles Tic-Tac-Toe via the NEW Compiler and prints
   ply-0 legal moves + that they match the dispatcher's output for the same game.
5. Keep the whole workspace `tsc` green. Do NOT touch `compiler1to1.ts` or the live
   `play1to1` path yet (parallel, additive). Do NOT reimplement ludeme eval logic.

Report: files created, the TTT proof output, and a crisp description of the
`registerLudeme` factory convention so the remaining ~480 keyword factories can be
authored in parallel.
