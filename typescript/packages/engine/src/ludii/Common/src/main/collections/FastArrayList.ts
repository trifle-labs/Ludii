// @java Common/src/main/collections/FastArrayList.java

/**
 * Less flexible, but faster alternative to ArrayList
 *
 * @java main.collections.FastArrayList
 * @author Dennis Soemers
 * @param E Type of elements to contain in this list
 */
export class FastArrayList<E> implements Iterable<E> {
  // -------------------------------------------------------------------------

  /** Our backing array */
  protected data: (E | null)[];

  /** The size of the ArrayList (the number of elements it contains). */
  private _size: number;

  /** Default initial capacity. */
  private static readonly DEFAULT_CAPACITY = 10;

  /** Used to check for concurrent modifications */
  protected modCount: number = 0;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @java FastArrayList()
   */
  public constructor();
  /**
   * Constructor
   * @java FastArrayList(int)
   */
  public constructor(initialCapacity: number);
  /**
   * Constructor (copy)
   * @java FastArrayList(FastArrayList<E>)
   */
  public constructor(other: FastArrayList<E>);
  /**
   * Constructor (from elements)
   * @java FastArrayList(E...)
   */
  public constructor(...elements: E[]);
  public constructor(arg?: number | FastArrayList<E> | E, ...rest: E[]) {
    if (arg === undefined) {
      this.data = new Array(FastArrayList.DEFAULT_CAPACITY).fill(null);
      this._size = 0;
    } else if (typeof arg === "number") {
      this.data = new Array(arg).fill(null);
      this._size = 0;
    } else if (arg instanceof FastArrayList) {
      this.data = arg.data.slice(0, arg._size);
      this._size = this.data.length;
    } else {
      const elements = [arg as E, ...rest];
      this.data = [...elements] as (E | null)[];
      this._size = this.data.length;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Adds object e to list
   * @java FastArrayList.add(E)
   */
  public add(e: E): void;
  /**
   * Adds object e to list at a specific index.
   * @java FastArrayList.add(int, E)
   */
  public add(index: number, e: E): void;
  public add(indexOrE: number | E, e?: E): void {
    if (e === undefined) {
      // add(E)
      ++this.modCount;
      this.ensureCapacityInternal(this._size + 1);
      this.data[this._size++] = indexOrE as E;
    } else {
      // add(int, E)
      const index = indexOrE as number;
      this.modCount++;
      const s = this._size;
      if (s === this.data.length)
        this.grow(s + 1);
      // shift right
      for (let i = s; i > index; i--)
        this.data[i] = this.data[i - 1]!;
      this.data[index] = e;
      this._size = s + 1;
    }
  }

  /**
   * Adds all elements from the other given list
   * @java FastArrayList.addAll(FastArrayList<E>)
   */
  public addAll(other: FastArrayList<E>): void {
    ++this.modCount;
    const numNew = other._size;
    this.ensureCapacityInternal(this._size + numNew);
    for (let i = 0; i < numNew; i++)
      this.data[this._size + i] = other.data[i]!;
    this._size += numNew;
  }

  /**
   * @param index Index at which to remove element
   * @return Remove item at the specified index and return.
   * @java FastArrayList.remove(int)
   */
  public remove(index: number): E {
    const r = this.data[index] as E;
    this.modCount++;
    if (index !== --this._size) {
      for (let i = index; i < this._size; i++)
        this.data[i] = this.data[i + 1]!;
    }
    this.data[this._size] = null;
    return r;
  }

  /**
   * Removes element at given index, and returns it.
   * Elements behind it are not shifted to the left, but only
   * the last element is swapped into the given idx.
   * @java FastArrayList.removeSwap(int)
   */
  public removeSwap(index: number): E {
    const r = this.data[index] as E;
    this.modCount++;
    if (index !== --this._size)
      this.data[index] = this.data[this._size]!;
    this.data[this._size] = null;
    return r;
  }

  /**
   * Replaces the element at the specified position in this list with
   * the specified element.
   * @java FastArrayList.set(int, E)
   */
  public set(index: number, element: E): void {
    this.data[index] = element;
  }

  /**
   * Clears the list
   * @java FastArrayList.clear()
   */
  public clear(): void {
    ++this.modCount;
    for (let i = 0; i < this._size; ++i)
      this.data[i] = null;
    this._size = 0;
  }

  /**
   * @param o
   * @return True if o is contained in this list
   * @java FastArrayList.contains(Object)
   */
  public contains(o: unknown): boolean {
    return this.indexOf(o) >= 0;
  }

  /** @java FastArrayList.equals(Object) */
  public equals(o: unknown): boolean {
    if (o === this)
      return true;

    if (!(o instanceof FastArrayList))
      return false;

    const other = o as FastArrayList<E>;

    if (this._size !== other._size)
      return false;

    for (let i = 0; i < this._size; ++i) {
      if (this.data[i] !== other.data[i]) {
        // For objects, try .equals if available
        const a = this.data[i] as { equals?: (v: unknown) => boolean } | null;
        if (a && typeof a.equals === "function") {
          if (!a.equals(other.data[i]))
            return false;
        } else {
          return false;
        }
      }
    }

    return true;
  }

  /** @java FastArrayList.hashCode() */
  public hashCode(): number {
    let hash = 1;
    for (let i = 0; i < this._size; ++i) {
      const e = this.data[i];
      if (e === null) {
        hash = 31 * hash;
      } else {
        const hc = (e as { hashCode?: () => number }).hashCode;
        hash = 31 * hash + (typeof hc === "function" ? hc.call(e) : 0);
      }
    }
    return hash;
  }

  /**
   * @param i
   * @return Element at index i.
   * @java FastArrayList.get(int)
   */
  public get(i: number): E {
    return this.data[i] as E;
  }

  /**
   * @param o
   * @return First index of o in this list, or -1 if it is not in the list
   * @java FastArrayList.indexOf(Object)
   */
  public indexOf(o: unknown): number {
    if (o === null || o === undefined) {
      for (let i = 0; i < this._size; i++)
        if (this.data[i] === null || this.data[i] === undefined)
          return i;
    } else {
      for (let i = 0; i < this._size; i++) {
        const item = this.data[i];
        if (item === o)
          return i;
        if (item !== null && item !== undefined && (item as unknown as { equals?: (v: unknown) => boolean }).equals) {
          if ((item as unknown as { equals: (v: unknown) => boolean }).equals(o))
            return i;
        }
      }
    }
    return -1;
  }

  /**
   * @return Whether this list is currently empty
   * @java FastArrayList.isEmpty()
   */
  public isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Removes all elements from this list except for those that are also in the other list
   * @java FastArrayList.retainAll(FastArrayList<E>)
   */
  public retainAll(other: FastArrayList<E>): void {
    this.batchRemove(other, true);
  }

  /**
   * @return Current size of list
   * @java FastArrayList.size()
   */
  public size(): number {
    return this._size;
  }

  /**
   * @return Copy of the backing array, limited to size
   * @java FastArrayList.toArray()
   */
  public toArray(): (E | null)[] {
    return this.data.slice(0, this._size);
  }

  // -------------------------------------------------------------------------

  /** @java FastArrayList.toString() */
  public toString(): string {
    const iMax = this._size - 1;
    if (iMax === -1)
      return "[]";

    let b = "[";
    for (let i = 0; ; i++) {
      b += String(this.data[i]);
      if (i === iMax)
        return b + "]";
      b += ", ";
    }
  }

  // -------------------------------------------------------------------------

  /** @java FastArrayList.iterator() */
  [Symbol.iterator](): Iterator<E> {
    let cursor = 0;
    const data = this.data;
    const size = this._size;
    return {
      next(): IteratorResult<E> {
        if (cursor !== size) {
          return { value: data[cursor++] as E, done: false };
        }
        return { value: undefined as unknown as E, done: true };
      }
    };
  }

  // -------------------------------------------------------------------------

  /**
   * Removes a batch based on what's in the other list
   * @java FastArrayList.batchRemove(FastArrayList<E>, boolean)
   */
  private batchRemove(other: FastArrayList<E>, complement: boolean): void {
    const dataN = this.data;
    let r = 0, w = 0;
    for (; r < this._size; r++)
      if (other.contains(dataN[r]) === complement)
        dataN[w++] = dataN[r]!;
    this.modCount += this._size - w;
    for (let i = w; i < this._size; i++)
      dataN[i] = null;
    this._size = w;
  }

  /**
   * Ensures we have at least the given amount of capacity
   * @java FastArrayList.ensureCapacityInternal(int)
   */
  private ensureCapacityInternal(minCapacity: number): void {
    if (minCapacity > this.data.length)
      this.grow(minCapacity);
  }

  /**
   * Grows the backing array
   * @java FastArrayList.grow(int)
   */
  private grow(minCapacity: number): void {
    const oldCapacity = this.data.length;
    let newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity < minCapacity)
      newCapacity = minCapacity;

    const newData = new Array(newCapacity).fill(null);
    for (let i = 0; i < this.data.length; i++)
      newData[i] = this.data[i];
    this.data = newData;
  }

  // -------------------------------------------------------------------------
}
