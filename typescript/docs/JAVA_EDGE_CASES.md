# Canonical Java Behaviour Examples for Tricky Edge Cases

A running list of corner-case behaviours in the Java engine that easily
break parity if a port skips them. Each entry shows the Java contract,
where it lives, the failure mode if you miss it, and how the TS port (or
the next port) should mirror it.

If you find a new edge case while porting — add it here. The bar for
inclusion is "I had to read the Java twice to see it."

---

## 1. `FastArrayList.set(int, E)` does **not** bump `modCount`

**Java:** `Common/src/main/collections/FastArrayList.java`,
`public E set(...)` — note the absence of `modCount++`.

**Why it matters:** Code that iterates with the Java iterator while
`set()`-ing elements relies on this. If the TS port increments a
modification counter in `set`, the next `iterator().next()` throws
`ConcurrentModificationException` — which is a parity break.

**TS test that catches it:** `fast-array-list.test.ts → "set does not
bump modCount (matches Java)"`. Verifies `equals()` still matches a peer
after `set()` and that iteration over the live list continues without
throwing.

---

## 2. `FastArrayList.get(i)` is **unchecked** past the live size

**Java:** `FastArrayList.get(int)` directly returns `data[i]`, which is
`null` for slots past the live size but within the backing array's
capacity.

**Why it matters:** A natural-feeling TS port would throw `RangeError`
when `i >= size`. Java doesn't. Callers exist that rely on getting
`null` (`undefined` in TS) for those slots.

**TS contract:** `get(i)` returns `E | undefined`; slots past `size` but
within capacity return `undefined`.

**TS test:** `fast-array-list.test.ts → ".get returns undefined past
size but within capacity"`.

---

## 3. `FastArrayList` iterator only fail-fasts when **the backing array
shrinks beneath the cursor**

**Java:** the iterator's `next()` throws CME when
`cursor >= data.length`, not when `cursor >= size`.

**Why it matters:** The copy constructor `FastArrayList(FastArrayList
other)` truncates the backing array to `other.size`. If a held iterator
references the original (now-truncated) backing array and walks past
the new end, that's the only path Java fail-fasts on.

**TS port:** the Java-style `iterator()` mirrors this exactly. The JS
`[Symbol.iterator]()` returns `{done: true}` at end-of-size rather than
throwing, because `[...list]` would otherwise be lossy.

**TS test:** `fast-array-list.test.ts → "iterator throws when the
backing array shrinks"`.

---

## 4. `Objects.equals(a, b)` dispatches on the **left** operand

**Java:** `Objects.equals(a, b)` is `a == b || (a != null &&
a.equals(b))`. The dispatch is on `a`, not `b`.

**Why it matters:** When porting a generic comparison and trying to
exercise CME via a self-mutating element, the trap element must sit in
the **receiver** list, not the peer. A port that dispatches on the right
operand will silently pass tests that should fail.

**TS port:** `defaultEquals(a, b)` follows the Java contract exactly:
identity first, then `a.equals(b)`.

**TS test:** `fast-array-list.test.ts → "equals throws CME when the
receiver is mutated mid-compare"`. Uses `Symbol("sentinel")` as the
peer's first slot so `defaultEquals` falls through to
`trap.equals(sentinel)` rather than short-circuiting on `===`.

---

## 5. `FastArrayList.equals` ignores capacity, only compares `size`
elements

**Java:** the equality contract is "same size + element-wise equal up to
size". Capacity is irrelevant.

**Why it matters:** If you accidentally compare the backing arrays,
`new FastArrayList(10)` and `new FastArrayList(20)` (both empty) would
compare unequal.

**TS test:** `fast-array-list.test.ts → "equals respects size and
ordered element equality"`.

---

## 6. `List.hashCode()` follows the JDK contract: `h = 31*h +
Objects.hashCode(e)`, starting from `h = 1`

**Java:** explicit in `java.util.List`'s javadoc. Empty list → 1.

**Why it matters:** Any other folding (e.g. starting from 0, or `h * 31
+ Objects.hashCode(e)` order swap) silently produces different hashes
and breaks any downstream code that hashes lists.

**TS port:** `defaultHashCode` plus `FastArrayList.hashCode()` reproduce
the exact contract, including the `Math.imul(31, h) | 0` int32 fold.

**TS test:** `fast-array-list.test.ts → "hashCode matches Java's
List.hashCode contract"`.

---

## 7. `BitSet.equals(other)` ignores capacity

**Java:** two bitsets with different word-array sizes but the same
logical bits are equal.

**Why it matters:** `new BitSet()` and `new BitSet(256)` (both empty)
must compare equal.

**TS test:** `bit-set.test.ts → "equals respects logical content, not
capacity"`.

---

## 8. `BitSet.hashCode()` for an empty set is exactly `1234`

**Java:** the hash starts at `1234L` and never gets folded if no words
are in use.

**Why it matters:** This is the most copy-pasted JDK hash constant in
the engine. Off-by-one inits silently break it.

**TS port:** `BitSet.hashCode()` runs the bigint-folded variant and
returns the int32 cast of `(h >> 32) ^ h`. For an empty set this
collapses to `Number(BigInt.asIntN(32, (1234n >> 32n) ^ 1234n)) === 1234`.

**TS test:** `bit-set.test.ts → "hashCode is stable and unaffected by
extra capacity"` includes the `=== 1234` check.

---

## 9. `BitSet.set(from, to)` is half-open, `to` is exclusive

**Java:** documented in javadoc; trips porters who assume `[from, to]`.

**Why it matters:** `set(3, 9)` sets six bits at indices 3..8 inclusive,
not seven. `set(i, i)` is a no-op.

**TS test:** `bit-set.test.ts → "set(from, to) sets a half-open range"`
and the multi-word variant.

---

## 10. `BitSet.length()` returns "one past the highest set bit", not
the cardinality

**Java:** distinct from `cardinality()`; `length()` is the position
needed for serialisation, `cardinality()` is the popcount.

**Why it matters:** Easy to swap by accident; both return numbers and
both feel like "the size of the set".

**TS port:** both methods exist; `length()` returns 0 when empty, while
`size()` returns the capacity-based word count × 32 (matching Java's
oddly-named `size()`).

---

## 11. `HashedBitSet.set(state, bitIndex, on)` only updates the state
hash on a **flip**

**Java:** `Core/src/other/state/zhash/HashedBitSet.java`:

```java
if (on != internalState.get(bitIndex)) trialState.updateStateHash(hashes[bitIndex]);
internalState.set(bitIndex, on);
```

**Why it matters:** A naive port that always calls `updateStateHash`
would double-XOR on a no-op set, producing wrong hashes immediately.

**TS port:** same flip-only update.

**TS test:** `hashed-bit-set.test.ts → ".set XORs the per-site hash on
a flip"` — sets the same bit to `true` twice and asserts the hash
doesn't change on the second call.

---

## 12. `HashedBitSet.calculateHashAfterRemap(siteRemap = null, invert =
true)` inverts the **value**, not the **site**

**Java:** the inversion flips `siteValue` before deciding whether to
fold in `hashes[site]` / `hashes[newSite]`. It does **not** change which
hash is folded; only whether it's folded.

**Why it matters:** Easy to interpret as "swap site i and site n-1-i",
which would change the structure of the hash entirely.

**TS test:** `hashed-bit-set.test.ts → ".calculateHashAfterRemap
honours invert flag"`.

---

## 13. Zobrist hashes are 64-bit signed `long`, not `number`

**Java:** `long[]` everywhere in zhash.

**Why it matters:** `(double) long` loses bits past 2^53. JS bitwise
operators are int32. Either silently corrupts the hash.

**TS port:** `bigint` end-to-end. `HashedBitSet` accepts `readonly
bigint[]` or `BigInt64Array`. The `ZobristState.updateStateHash(delta:
bigint)` signature forces callers into bigint.

---

## 14. (Open) Move generation and game-rules edge cases

To be filled in as the engine port lands. Anticipated entries:

- **Cycle detection in repeat-position rules** — Java uses
  `Trial`'s state-hash list; the port needs identical hash sequencing.
- **Stochastic moves and RNG seeding** — must reproduce Java's
  `SplitMix64` (or equivalent) so trials replay byte-for-byte.
- **Move pre-conditions vs effects** — Java's `Move` stores both
  consequents and pre-conditions; order matters for legality testing.
- **Score rounding** — Java truncates to int in several scoring rules.

Add entries with the same "Java / Why it matters / TS port / TS test"
shape as the existing ones.
