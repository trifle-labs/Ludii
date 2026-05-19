# Ludii TypeScript Workspace

This workspace holds the TypeScript port for this fork of Ludii.

## Packages

### `@ludii/typescript-common`

Shared utilities that are being ported from the Java `Common` and `Core` modules.

Current coverage includes:

- `FVector`
  - constructors for zero-filled, filled, copied, and wrapped vectors
  - vector arithmetic and scalar transforms
  - softmax, normalisation, entropy, and sampling helpers
  - structural editing helpers such as `range()`, `append()`, `cut()`, and `insert()`
  - cross-vector helpers such as `concat()`, `crossEntropy()`, `klDivergence()`, and `mean()`
- `FastArrayList`
  - all constructors (default, sized, copy, varargs/array)
  - mutators: `add`, `add(index, e)`, `addAll`, `remove`, `removeSwap`, `set`, `clear`, `retainAll`
  - accessors: `get`, `size`, `isEmpty`, `contains`, `indexOf`, `toArray`
  - value semantics: `equals` (with fail-fast `ConcurrentModificationException`), Java-compatible `hashCode`, and `toString`
  - both an idiomatic JavaScript `[Symbol.iterator]` and a Java-style `iterator()` exposing `hasNext` / `next`
- Shared `ConcurrentModificationException` plus `defaultEquals` and `defaultHashCode` helpers for cross-port parity
- `ChunkSet`
  - bitset-style single-bit and range operations
  - packed chunk read/write helpers for powers-of-two chunk sizes up to 32 bits
  - logical combinators, shifting, and chunk-resolution helpers used by CSP-style state encodings
- `BitSet`
  - point and range `set` / `clear` / `flip`, automatic word-array growth
  - `nextSetBit`, `nextClearBit`, `cardinality`, `length`, `intersects`
  - logical combinators `and` / `or` / `xor` / `andNot`
  - Java-parity `equals` / `hashCode` / `toString` and a set-bit iterator
- `ZobristHashGenerator`
  - deterministic SplitMix64 PRNG seeded with the same constant as the Java implementation
  - returns signed 64-bit `bigint` values (Java `long`-compatible)
  - `getSequencePosition()` for tracking generator state
  - positional constructor for fast-forwarding to a given offset in the sequence
- `ZobristHashUtilities`
  - `getHashGenerator()` — fresh seeded generator
  - `getSequence(gen, dim)` — 1-D `BigInt64Array`
  - `getSequence(gen, dim1, dim2)` — 2-D array
  - `getSequence(gen, dim1, dim2, dim3)` — 3-D array
  - `INITIAL_VALUE` (`0n`) and `UNKNOWN` (`-1n`) constants
- `HashedBitSet`
  - `BitSet`-backed Zobrist-hashed state with injected `ZobristState` adapter
  - per-site `bigint` hash sequences (also accepts `BigInt64Array`)
  - mutating ops (`set`, `clear`, `setTo`) maintain the running state hash
  - `calculateHashAfterRemap` for canonical-hash computation
- Parity-test fixture helpers (`parity-fixture`)
  - `checkParity(label, expected, actual)` — deep-equal assertion with labelled failure message
  - `checkParityBigInt(label, expected, actual)` — signed 64-bit bigint comparison with hex display
  - `checkParityFloat(label, expected, actual, epsilon?)` — floating-point comparison within tolerance
  - `checkParityBigIntArray(label, expected, actual)` — element-wise array comparison

Primary sources:

- `Common/src/main/collections/FVector.java`
- `Common/src/main/collections/FastArrayList.java`
- `Common/src/main/collections/ChunkSet.java`
- `java.util.BitSet` (JDK reference; see `BitSet` documentation)
- `Core/src/other/state/zhash/ZobristHashGenerator.java`
- `Core/src/other/state/zhash/ZobristHashUtilities.java`
- `Core/src/other/state/zhash/HashedBitSet.java`

### `@ludii/typescript-language`

First slice of the Java `Language/` module (parser/description primitives) plus
a minimal `.lud` reader.

Current coverage includes:

- `SelectionType` — string-literal-union mirror of the Java enum (CONTEXT,
  SELECTION, TYPING), plus a frozen `SELECTION_TYPE_VALUES` array in Java
  declaration order
- `TokenRange` — `from()` / `to()` accessor-style value object for half-open
  token ranges within a source string
- `lexLud` — S-expression lexer (round + curly parens, double-quoted
  strings, signed numeric literals, identifiers, `//` line comments)
- `parseLud` — recursive-descent parser producing a tagged AST
  (`LudNode = LudList | LudIdent | LudString | LudNumber`), with
  `LudParseError` reporting offending source offsets
- `LudAst` helpers (`isList`, `isIdent`, `isString`, `isNumber`,
  `listHead`) for walking the parsed tree

Primary sources:

- `Language/src/parser/SelectionType.java`
- `Language/src/parser/TokenRange.java`
- `Common/res/lud/test/Tic-Tac-Toe Renamed.lud` (corpus reference used
  in parser tests)

### `@ludii/typescript-engine`

A TypeScript-native engine surface that satisfies the
`BrowserGameSession` contract pinned in
[`docs/BROWSER_PLAYER_ROADMAP.md`](docs/BROWSER_PLAYER_ROADMAP.md). It
is the MVE-tier predecessor to a byte-for-byte port of the Java engine
(tracked in [`docs/ISSUE_BACKLOG.md`](docs/ISSUE_BACKLOG.md)).

Current coverage includes:

- `Move`, `State`, `Trial`, `Context`, `Game` — immutable value
  classes mirroring the subset of the Java engine that the
  browser-player calls
- `FlatBoardGame` — concrete `Game` for rectangular boards with the
  "place on empty until N-in-a-row" rule; supports any width/height,
  any number of players, configurable component labels, and any line
  length K
- `ticTacToeGame()` — convenience factory wired for the 3×3, K=3 case
- `HexGame` / `hexGame(size)` — concrete `Game` for the classic Hex
  connection game on an NxN rhombic board. Phase 2 of the browser-
  player roadmap: confirms the contract holds for a non-square-
  topology game without modification
- `compileLudSource` / `compileLudAst` — minimal `.lud` compiler that
  walks an AST produced by `@ludii/typescript-language` and builds a
  matching `FlatBoardGame`; `LudCompileError` reports offending source
  positions

Primary sources:

- `Core/src/other/move/Move.java` (conceptual)
- `Core/src/other/state/State.java` (conceptual)
- `Core/src/other/trial/Trial.java` (conceptual)
- `Core/src/other/context/Context.java` (conceptual)
- `Core/src/game/Game.java` (subset)

### `@ludii/typescript-browser-player`

A browser-focused package that drives the ported engine in a real
DOM environment.

Current contents:

- `BrowserGame` / `BrowserGameSession` / `BrowserMove` / `BrowserState`
  contract types (the DOM-layer API surface defined in
  [`docs/BROWSER_PLAYER_ROADMAP.md`](docs/BROWSER_PLAYER_ROADMAP.md))
- `EngineSession` — adapter that wraps a `Game` / `Context` from
  `@ludii/typescript-engine` to satisfy the contract; supports
  `apply`, `legalMovesAtSite`, `reset`, and `truncate` (read-only
  history scrubbing)
- `createTicTacToeSession` / `createHexSession` /
  `createSessionFromLud` factories
- `EmbeddedLudii` — DOM surface that renders any `BrowserGameSession`,
  with status region (`role=status`, `aria-live=polite`), live cell
  buttons, a move-history sidebar driven by `Trial`, Undo/Redo
  buttons, arrow-key grid navigation, and focus restoration after
  Reset
- Theming hooks via CSS custom properties on `.ludii-embed`
  (`--ludii-bg`, `--ludii-cell-bg`, `--ludii-cell-border`,
  `--ludii-cell-radius`, `--ludii-focus`, `--ludii-font`, ...)
- `createTicTacToeEmbed` / `createHexEmbed` / `createLudiiEmbed` /
  `createLudGameEmbed` helpers
- `demo/index.html` — zero-build demo with a game switcher (built-in
  Tic-Tac-Toe, built-in Hex with selectable size, or a `.lud`
  textarea + Load button)

## Workspace commands

Run all commands from the repository root:

```bash
npm install
npm run lint
npm run build
npm test
```

Additional useful commands:

```bash
npm run typecheck
npm run build --workspace @ludii/typescript-common
npm run build --workspace @ludii/typescript-browser-player
```

## Browser demo

```bash
npm run build --workspace @ludii/typescript-browser-player
```

Then open:

- `typescript/packages/browser-player/demo/index.html`

## Parity testing workflow

When porting a Java class:

1. Run the Java class and capture representative outputs (manually or via a small JUnit test that prints to stdout).
2. Use the helpers from `parity-fixture.ts` to write assertions against those captured values in the TypeScript test file.
3. The test will fail if the TypeScript implementation drifts from the Java original.

```typescript
import { checkParity, checkParityBigInt, checkParityFloat } from "@ludii/typescript-common";

// Values captured from the Java run:
checkParity("FVector.softmax([1,2,3])[2]", 0.6652409076690674, result[2]);
checkParityBigInt("ZobristHashGenerator.next() #1", -6987234182398721234n, gen.next());
checkParityFloat("softmax sum", 1.0, result.reduce((a, b) => a + b, 0));
```

## Porting expectations

When porting Java classes into this workspace:

1. Preserve the Java API shape where it remains natural in TypeScript.
2. Keep parity-sensitive behavior covered by automated tests.
3. Prefer small, self-contained packages over cross-cutting edits across the repository.
4. Document the originating Java source file in the package README or code review notes.

## Near-term follow-up

- expand the `.lud` compiler beyond the tic-tac-toe-shaped subset
  (stacking pieces, conditional rules, the connection rules used by
  Hex, etc.)
- begin the byte-for-byte Java engine ports tracked in
  [`docs/ISSUE_BACKLOG.md`](docs/ISSUE_BACKLOG.md), then swap the
  TS-native `Game` implementations for the real ported
  `Game`/`State`/`Trial`/`Context`
- animation between states (the last remaining Phase 4 item on
  [`docs/BROWSER_PLAYER_ROADMAP.md`](docs/BROWSER_PLAYER_ROADMAP.md))
