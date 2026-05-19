# Ludii TypeScript Workspace

This workspace holds the TypeScript port for this fork of Ludii.

## Packages

### `@ludii/typescript-common`

Shared utilities that are being ported from the Java `Common` module.

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
- `HashedBitSet`
  - `BitSet`-backed Zobrist-hashed state with injected `ZobristState` adapter
  - per-site `bigint` hash sequences (also accepts `BigInt64Array`)
  - mutating ops (`set`, `clear`, `setTo`) maintain the running state hash
  - `calculateHashAfterRemap` for canonical-hash computation

Primary sources:

- `/home/runner/work/Ludii/Ludii/Common/src/main/collections/FVector.java`
- `Common/src/main/collections/FastArrayList.java`
- `/home/runner/work/Ludii/Ludii/Common/src/main/collections/ChunkSet.java`
- `java.util.BitSet` (JDK reference; see `BitSet` documentation)
- `Core/src/other/state/zhash/HashedBitSet.java`

### `@ludii/typescript-browser-player`

A browser-focused package that proves the port can target a web runtime now, before the full engine is available.

Current contents:

- `TicTacToeGame`: a small deterministic game model used for package and UI validation
- `EmbeddedTicTacToe`: a DOM-driven embeddable surface
- `demo/index.html`: a zero-build demo page for quick manual checks

## Workspace commands

Run all commands from `/home/runner/work/Ludii/Ludii`:

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
cd /home/runner/work/Ludii/Ludii
npm run build --workspace @ludii/typescript-browser-player
```

Then open:

- `/home/runner/work/Ludii/Ludii/typescript/packages/browser-player/demo/index.html`

## Porting expectations

When porting Java classes into this workspace:

1. Preserve the Java API shape where it remains natural in TypeScript.
2. Keep parity-sensitive behavior covered by automated tests.
3. Prefer small, self-contained packages over cross-cutting edits across the repository.
4. Document the originating Java source file in the package README or code review notes.

## Near-term follow-up

- expand `@ludii/typescript-common` beyond `FVector`
- begin porting parser- and description-oriented primitives from `Language`
- replace the placeholder browser game with real Ludii-backed browser state and rendering once the engine port is ready
