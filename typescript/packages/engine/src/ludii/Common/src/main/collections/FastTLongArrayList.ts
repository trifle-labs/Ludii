// @java Common/src/main/collections/FastTLongArrayList.java

/**
 * Even more optimised version of TLongArrayList (using bigint for Java longs);
 * provides a faster copy constructor.
 *
 * @java main.collections.FastTLongArrayList
 * @author Dennis Soemers
 */
export class FastTLongArrayList {
  // -------------------------------------------------------------------------

  /** No-entry value sentinel (Java: -99L) */
  protected no_entry_value: bigint = -99n;

  /** The backing data array. */
  protected _data: bigint[];

  /** Current position (size). */
  protected _pos: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @java FastTLongArrayList()
   */
  public constructor();
  /**
   * Optimised copy constructor
   * @java FastTLongArrayList(FastTLongArrayList)
   */
  public constructor(other: FastTLongArrayList);
  public constructor(other?: FastTLongArrayList) {
    if (other === undefined) {
      this._data = [];
      this._pos = 0;
    } else {
      this.no_entry_value = -99n;
      const length = other.size();

      if (length > 0) {
        this._data = other._data.slice(0, length);
        this._pos = length;
      } else {
        this._data = [];
        this._pos = 0;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return The size (number of elements).
   * @java FastTLongArrayList.size()
   */
  public size(): number {
    return this._pos;
  }

  /**
   * @return True if empty.
   * @java FastTLongArrayList.isEmpty()
   */
  public isEmpty(): boolean {
    return this._pos === 0;
  }

  /**
   * Adds a value to the end.
   * @java FastTLongArrayList.add(long)
   */
  public add(val: bigint): boolean {
    this._data[this._pos++] = val;
    return true;
  }

  /**
   * @param index
   * @return Element at given index.
   * @java FastTLongArrayList.get(int)
   */
  public get(index: number): bigint {
    return this._data[index]!;
  }

  /**
   * Sets value at given index.
   * @java FastTLongArrayList.set(int, long)
   */
  public set(index: number, val: bigint): bigint {
    const old = this._data[index]!;
    this._data[index] = val;
    return old;
  }

  /**
   * Removes the element at given index.
   * @java FastTLongArrayList.removeAt(int)
   */
  public removeAt(index: number): bigint {
    const val = this._data[index]!;
    for (let i = index; i < this._pos - 1; i++)
      this._data[i] = this._data[i + 1]!;
    this._pos--;
    return val;
  }

  /**
   * Clears the list.
   * @java FastTLongArrayList.clear()
   */
  public clear(): void {
    this._pos = 0;
  }

  /**
   * @return A copy of the data as an array.
   * @java FastTLongArrayList.toArray()
   */
  public toArray(): bigint[] {
    return this._data.slice(0, this._pos);
  }

  // -------------------------------------------------------------------------
}
