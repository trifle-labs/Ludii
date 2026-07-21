import assert from "node:assert/strict";
import test from "node:test";

import {
  ConcurrentModificationException,
  defaultHashCode,
  FastArrayList,
} from "../src/index.js";

test("FastArrayList default constructor allocates capacity 10", () => {
  const list = new FastArrayList<string>();
  assert.equal(list.size(), 0);
  assert.equal(list.isEmpty(), true);
  assert.equal(list.capacityForTesting(), 10);
});

test("FastArrayList(int) honours the requested initial capacity", () => {
  const list = new FastArrayList<number>(3);
  assert.equal(list.capacityForTesting(), 3);
  list.add(1);
  list.add(2);
  list.add(3);
  // Adding a fourth element should trigger growth.
  list.add(4);
  assert.equal(list.size(), 4);
  assert.ok(list.capacityForTesting() >= 4);
});

test("FastArrayList(varargs) preserves order and length", () => {
  const list = new FastArrayList<number>([10, 20, 30]);
  assert.equal(list.size(), 3);
  assert.equal(list.get(0), 10);
  assert.equal(list.get(2), 30);
  assert.deepEqual(list.toArray(), [10, 20, 30]);
});

test("FastArrayList copy constructor mirrors Java size/capacity behaviour", () => {
  const source = new FastArrayList<number>(16);
  source.add(1);
  source.add(2);
  const copy = new FastArrayList<number>(source);
  assert.equal(copy.size(), 2);
  // Java code: data = Arrays.copyOf(other.data, other.size); size = data.length;
  // → the copy's capacity equals the source's size, not its capacity.
  assert.equal(copy.capacityForTesting(), 2);
});

test("FastArrayList grows by 1.5× when full", () => {
  const list = new FastArrayList<number>(4);
  for (let i = 0; i < 4; ++i) list.add(i);
  assert.equal(list.capacityForTesting(), 4);
  list.add(4);
  // grow(): newCapacity = old + (old >> 1) = 4 + 2 = 6
  assert.equal(list.capacityForTesting(), 6);
});

test("FastArrayList add(index, e) shifts elements right", () => {
  const list = new FastArrayList<string>(["a", "b", "d"]);
  list.add(2, "c");
  assert.deepEqual(list.toArray(), ["a", "b", "c", "d"]);
  list.add(0, "z");
  assert.deepEqual(list.toArray(), ["z", "a", "b", "c", "d"]);
  list.add(5, "tail");
  assert.deepEqual(list.toArray(), ["z", "a", "b", "c", "d", "tail"]);
});

test("FastArrayList addAll appends the other list", () => {
  const a = new FastArrayList<number>([1, 2, 3]);
  const b = new FastArrayList<number>([4, 5]);
  a.addAll(b);
  assert.deepEqual(a.toArray(), [1, 2, 3, 4, 5]);
  assert.equal(b.size(), 2);
});

test("FastArrayList remove shifts the tail left and nulls the freed slot", () => {
  const list = new FastArrayList<number>([1, 2, 3, 4]);
  const removed = list.remove(1);
  assert.equal(removed, 2);
  assert.deepEqual(list.toArray(), [1, 3, 4]);
  assert.equal(list.size(), 3);
});

test("FastArrayList removeSwap swaps the tail into the freed slot", () => {
  const list = new FastArrayList<number>([10, 20, 30, 40]);
  const removed = list.removeSwap(1);
  assert.equal(removed, 20);
  assert.deepEqual(list.toArray(), [10, 40, 30]);
});

test("FastArrayList set does not bump modCount (matches Java)", () => {
  const list = new FastArrayList<number>([1, 2, 3]);

  // Snapshot equals() against a peer; setting an element must not break the
  // peer comparison because Java's set() deliberately skips modCount++.
  const peer = new FastArrayList<number>([1, 99, 3]);
  list.set(1, 99);
  assert.equal(list.equals(peer), true);

  // After set(), iteration must not throw a ConcurrentModificationException.
  const iter = list.iterator();
  list.set(0, 100);
  const collected: number[] = [];
  while (iter.hasNext()) {
    const next = iter.next();
    if (!next.done) collected.push(next.value);
  }
  assert.deepEqual(collected, [100, 99, 3]);
});

test("FastArrayList clear() releases references and resets size", () => {
  const list = new FastArrayList<string>(["x", "y", "z"]);
  list.clear();
  assert.equal(list.size(), 0);
  assert.equal(list.isEmpty(), true);
});

test("FastArrayList contains/indexOf with primitive values", () => {
  const list = new FastArrayList<string>(["a", "b", "c"]);
  assert.equal(list.contains("b"), true);
  assert.equal(list.indexOf("c"), 2);
  assert.equal(list.indexOf("z"), -1);
});

test("FastArrayList indexOf delegates to .equals() when present", () => {
  class Token {
    public constructor(public readonly value: number) {}
    public equals(other: unknown): boolean {
      return other instanceof Token && other.value === this.value;
    }
  }
  const list = new FastArrayList<Token>([new Token(1), new Token(2)]);
  assert.equal(list.indexOf(new Token(2)), 1);
  assert.equal(list.contains(new Token(99)), false);
});

test("FastArrayList retainAll keeps the intersection in order", () => {
  const a = new FastArrayList<number>([1, 2, 3, 4, 5]);
  const b = new FastArrayList<number>([2, 4, 6]);
  a.retainAll(b);
  assert.deepEqual(a.toArray(), [2, 4]);
});

test("FastArrayList equals respects size and ordered element equality", () => {
  const a = new FastArrayList<number>([1, 2, 3]);
  const b = new FastArrayList<number>([1, 2, 3]);
  const c = new FastArrayList<number>([1, 2]);
  const d = new FastArrayList<number>([1, 3, 2]);
  assert.equal(a.equals(b), true);
  assert.equal(a.equals(c), false);
  assert.equal(a.equals(d), false);
  assert.equal(a.equals("not a list"), false);
});

test("FastArrayList hashCode matches Java's List.hashCode contract", () => {
  // Java reference: int h = 1; for (e in list) h = 31*h + Objects.hashCode(e);
  const javaListHash = (elements: readonly unknown[]): number => {
    let h = 1;
    for (const e of elements) {
      h = (Math.imul(31, h) + defaultHashCode(e)) | 0;
    }
    return h;
  };

  const list = new FastArrayList<string>(["alpha", "beta", "gamma"]);
  assert.equal(list.hashCode(), javaListHash(["alpha", "beta", "gamma"]));

  const ints = new FastArrayList<number>([1, 2, 3, 4]);
  assert.equal(ints.hashCode(), javaListHash([1, 2, 3, 4]));

  // Empty list → 1, exactly like Java's List.of().hashCode().
  assert.equal(new FastArrayList<number>().hashCode(), 1);
});

test("FastArrayList toString matches the Java [a, b, c] form", () => {
  assert.equal(new FastArrayList<number>().toString(), "[]");
  assert.equal(new FastArrayList<number>([1]).toString(), "[1]");
  assert.equal(
    new FastArrayList<string>(["a", "b", "c"]).toString(),
    "[a, b, c]",
  );
});

test("FastArrayList iterator walks the live elements", () => {
  const list = new FastArrayList<number>([7, 8, 9]);
  const seen = [...list];
  assert.deepEqual(seen, [7, 8, 9]);
});

test("FastArrayList iterator throws when the backing array shrinks", () => {
  // The Java iterator only fail-fasts when `cursor >= data.length`, i.e.
  // when the backing array shrinks beneath the cursor. The copy
  // constructor truncates the backing array, exposing exactly that case.
  const original = new FastArrayList<number>(10);
  original.add(1);
  original.add(2);
  original.add(3);

  const it = original.iterator();
  assert.equal((it.next() as IteratorResult<number>).value, 1);

  // Shrink the underlying capacity via the copy constructor.
  // Then mutate the original to point to the truncated array.
  const truncated = new FastArrayList<number>(original);
  assert.equal(truncated.capacityForTesting(), 3);

  // Iterating the truncated list straight to its end is fine.
  const it2 = truncated.iterator();
  while (it2.hasNext()) it2.next();

  // But calling `next()` past the live size and the capacity must throw.
  assert.throws(
    () => it2.next(),
    (error: unknown) => error instanceof ConcurrentModificationException,
  );
});

test("FastArrayList.equals throws CME when the receiver is mutated mid-compare", () => {
  // `Objects.equals(a, b)` (and our `defaultEquals`) dispatches on the LEFT
  // operand. To trip the fail-fast path the trap must sit in the receiver
  // list, where `equals()` will be called during the comparison loop.
  class Trap {
    public constructor(private readonly list: FastArrayList<unknown>) {}
    public equals(_other: unknown): boolean {
      this.list.add("mutated");
      return true;
    }
  }
  const receiver = new FastArrayList<unknown>();
  const trap = new Trap(receiver);
  receiver.add(trap);
  receiver.add(2);
  receiver.add(3);
  // Peer's first slot is a sentinel (not nullish, not strictly equal to the
  // trap) so `defaultEquals` falls through to `trap.equals(sentinel)`.
  const sentinel = Symbol("sentinel");
  const peer = new FastArrayList<unknown>([sentinel, 2, 3]);

  assert.throws(
    () => receiver.equals(peer),
    (error: unknown) => error instanceof ConcurrentModificationException,
  );
});

test("FastArrayList.get returns undefined past size but within capacity", () => {
  // Java parity: `get(i)` is unchecked, returning the raw slot. Slots past
  // `size` hold `null` in Java, which surfaces as `undefined` in the port.
  const list = new FastArrayList<number>(10);
  list.add(1);
  // Index 5 is beyond size but well within capacity; should be undefined.
  assert.equal(list.get(5), undefined);
});
