# API-Shape Decisions: Java → TypeScript

This document ratifies the conventions the TypeScript port follows when
Java idioms don't map cleanly into TypeScript. Each section captures a
decision, the rationale, and what to do in practice. The decisions here
are the result of porting `FVector`, `FastArrayList`, `ChunkSet`,
`BitSet`, `HashedBitSet`, `SelectionType`, and `TokenRange` — i.e. they
have been exercised on real ports, not just sketched.

If a future port needs to deviate, capture the deviation in the PR
description so we can update this doc.

---

## 1. Generics

**Decision:** Mirror Java generics where Java has them (`FastArrayList<E>`),
drop them where Java's type erasure makes them effectively `Object`
(`ChunkSet`, `BitSet`).

**Rationale:** TypeScript generics are erased the same way Java's are, so
mirroring is cheap and helps callers. But adding generic parameters where
the Java class operates on raw bits/ints adds visual noise for zero
benefit.

**In practice:**
- `class FastArrayList<E>` ✅
- `class ChunkSet` (no generic param) ✅
- `class HashedBitSet` (no generic param — operates on bit indices and
  bigint hashes) ✅

---

## 2. Null vs `undefined`

**Decision:** Use `undefined` for "absent" in TypeScript signatures.
Translate Java `null` to `undefined` at the API boundary. Internally, an
empty slot in an array reads as `undefined` and that is the parity match
for Java's `null`.

**Rationale:** TypeScript's optional-parameter / `?:` types use
`undefined`, not `null`. Mixing the two creates two failure modes for
the same concept.

**In practice:**
- `FastArrayList.get(i)` returns `E | undefined` when `i` is past the
  live size (Java returns `null` for those slots).
- A "may be absent" return type is `T | undefined`, not `T | null`.
- Constructor "no argument" parameters use `?:` rather than `T | null`.

**Exception:** When a method's Java signature explicitly takes `null` to
mean "no remap" (e.g. `HashedBitSet.calculateHashAfterRemap(int[]
siteRemap, boolean invert)`), keep `null` in the TS signature to make
the parity contract obvious. This is rare; the default is `undefined`.

---

## 3. Checked exceptions

**Decision:** TypeScript has no checked exceptions. Throw the same
exception class the Java code throws, but don't try to annotate the
signature with a thrown-types comment.

**Rationale:** Mirroring Java's `throws SomeException` declarations as
JSDoc adds noise and gets out of sync. JavaScript runtime stack traces
already show the exception type.

**In practice:**
- `ConcurrentModificationException` is re-exported from
  `@ludii/typescript-common` and used wherever a Java port would throw
  it. ✅
- `RangeError` is the natural TS analogue of
  `IndexOutOfBoundsException` and `IllegalArgumentException` from
  index/range checks. Use it for bounds violations.
- Custom Ludii exceptions (`BadSyntaxException`, etc.) port to plain
  `class FooException extends Error` with the same name.

---

## 4. `equals` / `hashCode`

**Decision:** Expose `equals(other: unknown): boolean` and `hashCode():
number` as instance methods, exactly as Java does. Provide shared
`defaultEquals` and `defaultHashCode` helpers in
`@ludii/typescript-common` so generic containers (`FastArrayList`,
`BitSet` value comparison, etc.) can dispatch through them.

**Rationale:** TypeScript has no overloaded `===`. Container classes
need to compare arbitrary element types, and Java's `Objects.equals`
dispatches on `.equals()` if present. We replicate that exactly so a
ported `FastArrayList<MyType>` works the same way as Java's `ArrayList`.

**`hashCode()` parity:**
- Numbers → 32-bit int (Java `Integer.hashCode`).
- Strings → Java `String.hashCode` (`31*h + charCodeAt(i)`, folded to
  int32).
- Booleans → `1231` / `1237` (Java's `Boolean.hashCode`).
- Objects with a `hashCode()` method → delegate.
- 64-bit Java `long` hashes are folded through `bigint` to preserve
  bit identity (see `BitSet.hashCode()`).

---

## 5. Java enums

**Decision:** Port enums to frozen string-literal-union namespaces with
a parallel `_VALUES` array preserving declaration order.

**Rationale:** TypeScript `enum` is non-ergonomic (numeric by default,
runtime-only values) and complicates tree-shaking. A frozen object plus
a string-literal-union gives the same call site (`SelectionType.CONTEXT`)
and ports better through JSON.

**In practice:**
```ts
export const SelectionType = Object.freeze({
  CONTEXT: "CONTEXT",
  SELECTION: "SELECTION",
  TYPING: "TYPING",
} as const);
export type SelectionType =
  (typeof SelectionType)[keyof typeof SelectionType];
export const SELECTION_TYPE_VALUES: readonly SelectionType[] =
  Object.freeze([SelectionType.CONTEXT, ...]);
```

---

## 6. Java `long` arithmetic

**Decision:** Use `bigint` for any operation that needs exact 64-bit
semantics — Zobrist hashes, BitSet hash folding, anything XOR'd or
multiplied as `long` in Java.

**Rationale:** JS `number` loses bits past 2^53 and the bitwise
operators coerce to int32. The temptation to "just use number" silently
corrupts hashes and produces hard-to-debug parity drift.

**In practice:**
- `ZobristState.updateStateHash(delta: bigint): void`.
- `HashedBitSet` stores `readonly bigint[]` (or accepts
  `BigInt64Array`).
- `BitSet.hashCode()` folds two 32-bit words into a 64-bit Java word via
  `BigInt`, then returns the int32 hash, matching Java byte-for-byte.

---

## 7. Constructor overloading

**Decision:** Java's constructor overloads port to a single TS
constructor that uses a tagged-tuple parameter type (`...args: [E] |
[number, E]`) or `instanceof` discrimination. Don't fake overloads with
`Optional`-style `null` arguments.

**Rationale:** TS has true overload-signature support for constructors
but only one implementation body. The tagged-tuple pattern keeps the
call sites clean and avoids `arguments.length` (which Biome's
`noArguments` lints against).

**In practice:**
- `FastArrayList<E>(items)`, `FastArrayList<E>(capacity)`,
  `FastArrayList<E>(other)` — all dispatched via `instanceof` /
  `typeof` on the first arg in a single body. ✅
- `BitSet.set(idx)`, `BitSet.set(idx, value)`, `BitSet.set(from, to)` —
  ditto, using `typeof` discrimination on the second arg. ✅
- `HashedBitSet(state, hashes)` and `HashedBitSet(other)` — `instanceof
  HashedBitSet` discrimination. ✅

---

## 8. Iteration

**Decision:** Expose both an idiomatic `[Symbol.iterator]()` (JS
protocol) and a Java-style `iterator()` returning `{ hasNext, next }`
when the Java class implements `Iterable<E>`. The Java-style iterator
preserves fail-fast semantics; the JS-style one is permissive at the
end-of-collection boundary.

**Rationale:** `[...list]` is the natural JS spelling, but it calls
`next()` past the end and would otherwise trip fail-fast checks. Java
code that walks with `hasNext()/next()` ports verbatim against the
Java-style iterator.

**In practice:**
- `FastArrayList[Symbol.iterator]()` returns `{done: true}` cleanly at
  end. ✅
- `FastArrayList.iterator()` is Java-style and throws
  `ConcurrentModificationException` if the backing array shrinks
  beneath the cursor. ✅
- `BitSet[Symbol.iterator]()` walks set bits via `nextSetBit`. ✅

---

## 9. `static` helpers

**Decision:** Java `static` methods port to TS `static` methods on the
same class. Free functions only make sense when the helper isn't
logically attached to the class.

**Rationale:** Matching the original call sites (`FVector.concat(a, b)`)
is more important than micro-optimising for tree-shaking.

**In practice:** `FVector.concat`, `FVector.crossEntropy`,
`FVector.klDivergence`, `FVector.mean` — all ported as `static`. ✅

---

## 10. Mutability and `readonly`

**Decision:** Use `readonly T[]` for parameter types where the Java
signature is `final T[]` or where the method only reads the array. Don't
freeze instance fields by default — Java fields are mutable, and
freezing them adds runtime cost.

**Rationale:** `readonly` is a type-only annotation, zero runtime cost,
and catches mistakes at the API boundary. Freezing every internal array
slows down hot paths.

**In practice:**
- `HashedBitSet.calculateHashAfterRemap(siteRemap: readonly number[] |
  null, ...)`. ✅
- Internal `words: number[]` in `BitSet` is mutable; it is reassigned
  during `ensureCapacity`. ✅

---

## 11. Package boundaries

**Decision:** Port leaf utilities into `@ludii/typescript-common`.
Parser/description primitives go in `@ludii/typescript-language`.
Engine-internal types that pull in `State` / `Context` get an interface
adapter at the package boundary rather than a direct dependency on the
Java collaborator graph.

**Rationale:** Keeping `@ludii/typescript-common` free of `State` /
`Context` dependencies means it can be ported and used standalone, which
shortens the per-port lead time dramatically.

**In practice:**
- `HashedBitSet` does NOT depend on `State`. It takes a
  `ZobristState` adapter interface — anything with
  `updateStateHash(delta: bigint): void` — so callers can wire in the
  real `State` once it's ported without retroactively changing
  `HashedBitSet`. ✅

---

## 12. Exception ergonomics: `unknown` over `any`

**Decision:** `catch` clauses use `unknown` (with `instanceof` narrowing
when needed). Method signatures that compare an arbitrary value to a
typed instance accept `other: unknown` and narrow inside.

**Rationale:** `unknown` is the TypeScript-native counterpart to Java's
`Object`. `any` opts out of type-checking entirely and almost always
masks real bugs.

**In practice:** `equals(other: unknown): boolean` uses `if (other ===
this) return true; if (!(other instanceof Foo)) return false;` to mirror
Java's `if (this == obj) return true; if (!(obj instanceof Foo)) return
false;`. ✅
