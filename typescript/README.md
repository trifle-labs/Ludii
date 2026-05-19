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

First slice of the Java `Language/` module (parser/description primitives).

Current coverage includes:

- `SelectionType` — string-literal-union mirror of the Java enum (CONTEXT,
  SELECTION, TYPING), plus a frozen `SELECTION_TYPE_VALUES` array in Java
  declaration order
- `TokenRange` — `from()` / `to()` accessor-style value object for half-open
  token ranges within a source string

Primary sources:

- `Language/src/parser/SelectionType.java`
- `Language/src/parser/TokenRange.java`

### `@ludii/typescript-browser-player`

A browser-focused package that proves the port can target a web runtime now, before the full engine is available.

Current contents:

- `TicTacToeGame`: a small deterministic game model used for package and UI validation
- `EmbeddedTicTacToe`: a DOM-driven embeddable surface
- `demo/index.html`: a zero-build demo page for quick manual checks

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

- port first parser/description primitive from `Language/` into a new `@ludii/typescript-language` package
- begin porting parser- and description-oriented primitives from `Language`
- replace the placeholder browser game with real Ludii-backed browser state and rendering once the engine port is ready
