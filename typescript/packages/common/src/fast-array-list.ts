/**
 * Less flexible, but faster alternative to ArrayList.
 *
 * Ported from `Common/src/main/collections/FastArrayList.java`
 * (author: Dennis Soemers).
 *
 * Notable parity points with the Java original:
 *
 * - Element equality uses `Objects.equals` semantics: identity first, then
 *   `equals()` on the left operand if available.
 * - `hashCode()` follows Java's `List` contract: `h = 31 * h + (e == null ? 0 :
 *   e.hashCode())`, so callers should supply elements that expose a
 *   Java-compatible `hashCode()` if they need cross-implementation parity.
 * - Structural mutations bump an internal `modCount`. `equals()` re-checks
 *   `modCount` and throws `ConcurrentModificationException` if the receiver
 *   was modified during the comparison, mirroring the Java fail-fast policy.
 * - `set()` deliberately does *not* bump `modCount` (matching the Java port).
 * - The iterator only checks `cursor >= data.length` (the capacity), not
 *   `modCount`, exactly like the Java implementation.
 */

import {
  ConcurrentModificationException,
  defaultEquals,
  defaultHashCode,
} from "./object-utils.js";

/** Default initial capacity. */
const DEFAULT_CAPACITY = 10;

export class FastArrayList<E> implements Iterable<E> {
  /** Backing storage. May contain `undefined` slots beyond `size`. */
  private data: (E | undefined)[];

  /** Number of elements logically stored in the list. */
  private length: number;

  /** Structural-mutation counter used to detect concurrent modification. */
  protected modCount: number;

  public constructor();
  public constructor(initialCapacity: number);
  public constructor(other: FastArrayList<E>);
  public constructor(elements: readonly E[]);
  public constructor(arg?: number | FastArrayList<E> | readonly E[]) {
    this.modCount = 0;

    if (arg === undefined) {
      this.data = new Array(DEFAULT_CAPACITY);
      this.length = 0;
      return;
    }

    if (typeof arg === "number") {
      if (!Number.isInteger(arg) || arg < 0) {
        throw new RangeError(
          "Initial capacity must be a non-negative integer.",
        );
      }
      this.data = new Array(arg);
      this.length = 0;
      return;
    }

    if (arg instanceof FastArrayList) {
      // Mirrors the Java `FastArrayList(FastArrayList<E>)` copy constructor:
      // the new list's capacity equals the source list's *size*.
      this.data = arg.data.slice(0, arg.length);
      this.length = this.data.length;
      return;
    }

    // Array / array-like — varargs equivalent.
    this.data = Array.from(arg);
    this.length = this.data.length;
  }

  // -------------------------------------------------------------------------
  // Mutators
  // -------------------------------------------------------------------------

  /** Append an element. */
  public add(element: E): void;
  /** Insert an element at the given index. */
  public add(index: number, element: E): void;
  public add(...args: [E] | [number, E]): void {
    if (args.length === 1) {
      ++this.modCount;
      this.ensureCapacityInternal(this.length + 1);
      this.data[this.length++] = args[0];
      return;
    }

    const index = args[0];
    const element = args[1];

    if (!Number.isInteger(index) || index < 0 || index > this.length) {
      throw new RangeError(
        `Index ${String(index)} out of bounds for length ${String(this.length)}`,
      );
    }

    ++this.modCount;
    const s = this.length;
    if (s === this.data.length) {
      this.grow(this.length + 1);
    }
    // Shift right by one starting at `index`.
    for (let i = s; i > index; --i) {
      this.data[i] = this.data[i - 1];
    }
    this.data[index] = element;
    this.length = s + 1;
  }

  /** Append every element of `other` to this list. */
  public addAll(other: FastArrayList<E>): void {
    ++this.modCount;
    const numNew = other.length;
    this.ensureCapacityInternal(this.length + numNew);
    for (let i = 0; i < numNew; ++i) {
      this.data[this.length + i] = other.data[i];
    }
    this.length += numNew;
  }

  /** Remove the element at the given index, shifting later elements left. */
  public remove(index: number): E {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) {
      throw new RangeError(
        `Index ${String(index)} out of bounds for length ${String(this.length)}`,
      );
    }
    const r = this.data[index] as E;
    ++this.modCount;
    const newSize = --this.length;
    if (index !== newSize) {
      for (let i = index; i < newSize; ++i) {
        this.data[i] = this.data[i + 1];
      }
    }
    this.data[newSize] = undefined;
    return r;
  }

  /**
   * Remove the element at `index`. Instead of shifting the tail left, the
   * last element is swapped into the vacated slot. O(1).
   */
  public removeSwap(index: number): E {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) {
      throw new RangeError(
        `Index ${String(index)} out of bounds for length ${String(this.length)}`,
      );
    }
    const r = this.data[index] as E;
    ++this.modCount;
    const newSize = --this.length;
    if (index !== newSize) {
      this.data[index] = this.data[newSize];
    }
    this.data[newSize] = undefined;
    return r;
  }

  /**
   * Replace the element at `index`. Intentionally does **not** bump
   * `modCount`, matching the Java implementation.
   */
  public set(index: number, element: E): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) {
      throw new RangeError(
        `Index ${String(index)} out of bounds for length ${String(this.length)}`,
      );
    }
    this.data[index] = element;
  }

  /** Remove every element. */
  public clear(): void {
    ++this.modCount;
    for (let i = 0; i < this.length; ++i) {
      this.data[i] = undefined;
    }
    this.length = 0;
  }

  /** Keep only elements that also appear in `other`. */
  public retainAll(other: FastArrayList<E>): void {
    this.batchRemove(other, true);
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** @returns the element at `index`. No bounds check (Java parity). */
  public get(index: number): E {
    return this.data[index] as E;
  }

  public size(): number {
    return this.length;
  }

  public isEmpty(): boolean {
    return this.length === 0;
  }

  public contains(value: unknown): boolean {
    return this.indexOf(value) >= 0;
  }

  public indexOf(value: unknown): number {
    if (value === null || value === undefined) {
      for (let i = 0; i < this.length; ++i) {
        if (this.data[i] === null || this.data[i] === undefined) {
          return i;
        }
      }
      return -1;
    }
    for (let i = 0; i < this.length; ++i) {
      if (defaultEquals(value, this.data[i])) {
        return i;
      }
    }
    return -1;
  }

  /** @returns a fresh array containing the live elements in order. */
  public toArray(): E[] {
    return this.data.slice(0, this.length) as E[];
  }

  // -------------------------------------------------------------------------
  // Value semantics
  // -------------------------------------------------------------------------

  public equals(other: unknown): boolean {
    if (other === this) {
      return true;
    }
    if (!(other instanceof FastArrayList)) {
      return false;
    }

    const expectedModCount = this.modCount;
    let result: boolean;
    try {
      const that = other as FastArrayList<E>;
      if (this.length !== that.length) {
        result = false;
      } else {
        let allEqual = true;
        for (let i = 0; i < this.length; ++i) {
          if (!defaultEquals(this.data[i], that.data[i])) {
            allEqual = false;
            break;
          }
        }
        result = allEqual;
      }
    } finally {
      this.checkForComodification(expectedModCount);
    }
    return result;
  }

  /**
   * Java-compatible list hash code:
   *
   * ```
   * int h = 1;
   * for (E e : list) h = 31 * h + (e == null ? 0 : e.hashCode());
   * ```
   *
   * Returns a 32-bit signed integer.
   */
  public hashCode(): number {
    const expectedModCount = this.modCount;
    let hash = 1;
    for (let i = 0; i < this.length; ++i) {
      const element = this.data[i];
      const elementHash =
        element === undefined || element === null
          ? 0
          : defaultHashCode(element);
      hash = (Math.imul(31, hash) + elementHash) | 0;
    }
    this.checkForComodification(expectedModCount);
    return hash;
  }

  public toString(): string {
    if (this.length === 0) {
      return "[]";
    }
    const parts: string[] = [];
    for (let i = 0; i < this.length; ++i) {
      parts.push(String(this.data[i]));
    }
    return `[${parts.join(", ")}]`;
  }

  // -------------------------------------------------------------------------
  // Iteration
  // -------------------------------------------------------------------------

  /**
   * Idiomatic JavaScript iterator. Terminates cleanly once `cursor` reaches
   * `size`; it also surfaces a fail-fast `ConcurrentModificationException`
   * if the backing array is shrunk beneath the cursor while iterating.
   */
  public [Symbol.iterator](): Iterator<E> {
    const list = this;
    let cursor = 0;
    return {
      next(): IteratorResult<E> {
        if (cursor >= list.length) {
          return { value: undefined as unknown as E, done: true };
        }
        if (cursor >= list.data.length) {
          throw new ConcurrentModificationException();
        }
        const value = list.data[cursor++] as E;
        return { value, done: false };
      },
    };
  }

  /**
   * Java-style iterator, preserving the original `hasNext` / `next` contract:
   * `next()` throws a `ConcurrentModificationException` whenever `cursor >=
   * data.length`, mirroring the "fast" check used by the Java implementation.
   * It is the caller's responsibility to honour `hasNext()` before invoking
   * `next()`, exactly as in Java.
   */
  public iterator(): Iterator<E> & { hasNext(): boolean } {
    const list = this;
    let cursor = 0;
    return {
      hasNext(): boolean {
        return cursor !== list.length;
      },
      next(): IteratorResult<E> {
        if (cursor >= list.data.length) {
          throw new ConcurrentModificationException();
        }
        const value = list.data[cursor++] as E;
        return { value, done: false };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private batchRemove(other: FastArrayList<E>, complement: boolean): void {
    const dataN = this.data;
    let r = 0;
    let w = 0;
    try {
      for (; r < this.length; ++r) {
        if (other.contains(dataN[r]) === complement) {
          dataN[w++] = dataN[r];
        }
      }
    } finally {
      this.modCount += this.length - w;
      if (r !== this.length) {
        // An exception escaped the loop above — preserve the unread tail.
        for (let i = 0; i < this.length - r; ++i) {
          dataN[w + i] = dataN[r + i];
        }
        w += this.length - r;
      }
      if (w !== this.length) {
        for (let i = w; i < this.length; ++i) {
          dataN[i] = undefined;
        }
        this.length = w;
      }
    }
  }

  private checkForComodification(expectedModCount: number): void {
    if (this.modCount !== expectedModCount) {
      throw new ConcurrentModificationException();
    }
  }

  private ensureCapacityInternal(minCapacity: number): void {
    if (minCapacity - this.data.length > 0) {
      this.grow(minCapacity);
    }
  }

  private grow(minCapacity: number): void {
    const oldCapacity = this.data.length;
    let newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0) {
      newCapacity = minCapacity;
    }
    this.data.length = newCapacity;
  }

  /** Test-only hook: exposes the backing-array length. */
  public capacityForTesting(): number {
    return this.data.length;
  }
}
