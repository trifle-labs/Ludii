// @java Common/src/main/collections/FastTIntArrayList.java

/**
 * Even more optimised version of TIntArrayList; provides a
 * faster copy constructor.
 *
 * Java source extends gnu.trove.list.array.TIntArrayList.
 * In TypeScript we implement the list directly with a backing Int32Array-style
 * approach using a plain number[] with manual capacity management, mirroring
 * the key fields: _data, _pos, no_entry_value.
 *
 * @java main/collections/FastTIntArrayList.java
 * @author Dennis Soemers
 */
export class FastTIntArrayList {

  /** @java FastTIntArrayList#EMPTY_ELEMENTDATA */
  private static readonly EMPTY_ELEMENTDATA: number[] = [];

  /** @java TIntArrayList#_data — backing storage */
  public _data: number[];

  /** @java TIntArrayList#_pos — number of elements in use */
  public _pos: number;

  /** @java TIntArrayList#no_entry_value */
  public no_entry_value: number;

  //-------------------------------------------------------------------------

  /**
   * Default constructor.
   * @java FastTIntArrayList()
   */
  public constructor();

  /**
   * Constructor with initial capacity.
   * @param capacity
   * @java FastTIntArrayList(int)
   */
  public constructor(capacity: number);

  /**
   * Optimised copy constructor.
   * @param other
   * @java FastTIntArrayList(FastTIntArrayList)
   */
  public constructor(other: FastTIntArrayList);

  public constructor(arg?: number | FastTIntArrayList) {
    if (arg === undefined) {
      // Default constructor
      this.no_entry_value = 0;
      this._data = [];
      this._pos = 0;
    } else if (typeof arg === "number") {
      // Capacity constructor
      this.no_entry_value = 0;
      this._data = new Array(arg);
      this._pos = 0;
    } else {
      // Copy constructor
      this.no_entry_value = -99;
      const length = arg.size();
      if (length > 0) {
        this._data = arg._data.slice(0, length);
        this._pos = length;
      } else {
        this._data = FastTIntArrayList.EMPTY_ELEMENTDATA.slice();
        this._pos = 0;
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Number of elements in this list.
   * @java TIntArrayList.size()
   */
  public size(): number {
    return this._pos;
  }

  /**
   * @return True if the list contains no elements.
   * @java TIntArrayList.isEmpty()
   */
  public isEmpty(): boolean {
    return this._pos === 0;
  }

  /**
   * Adds a value to the end of the list.
   * @param val
   * @java TIntArrayList.add(int)
   */
  public add(val: number): void {
    this._data[this._pos++] = val;
  }

  /**
   * Gets the value at the given index.
   * @param index
   * @java TIntArrayList.get(int)
   */
  public get(index: number): number {
    return this._data[index]!;
  }

  /**
   * Gets the value at the given index (no bounds-check equivalent).
   * @param index
   * @java TIntArrayList.getQuick(int)
   */
  public getQuick(index: number): number {
    return this._data[index]!;
  }

  /**
   * Sets the value at the given index.
   * @param index
   * @param val
   * @java TIntArrayList.set(int, int)
   */
  public set(index: number, val: number): void {
    this._data[index] = val;
  }

  /**
   * Sets the value at the given index (no bounds-check equivalent).
   * @param index
   * @param val
   * @java TIntArrayList.setQuick(int, int)
   */
  public setQuick(index: number, val: number): void {
    this._data[index] = val;
  }

  /**
   * Removes the element at the given index.
   * @param index
   * @java TIntArrayList.removeAt(int)
   */
  public removeAt(index: number): void {
    this._data.splice(index, 1);
    this._pos--;
  }

  /**
   * Inserts a value at the given index, shifting subsequent elements right.
   * @param index
   * @param val
   * @java TIntArrayList.insert(int, int)
   */
  public insert(index: number, val: number): void {
    this._data.splice(index, 0, val);
    this._pos++;
  }

  /**
   * Clears the list (sets pos to 0).
   * @java TIntArrayList.clear()
   */
  public clear(): void {
    this._pos = 0;
    this._data = [];
  }

  /**
   * Ensures that the list can hold at least the specified number of elements.
   * @param minCapacity
   * @java TIntArrayList.ensureCapacity(int)
   */
  public ensureCapacity(minCapacity: number): void {
    if (this._data.length < minCapacity) {
      const newCapacity = Math.max(2 * this._data.length, minCapacity);
      const newData = new Array(newCapacity);
      for (let i = 0; i < this._pos; i++) {
        newData[i] = this._data[i];
      }
      this._data = newData;
    }
  }

  /**
   * Sorts the list in ascending order.
   * @java TIntArrayList.sort()
   */
  public sort(): void {
    this._data.splice(this._pos);
    this._data.sort((a, b) => a - b);
  }

  //-------------------------------------------------------------------------

  /**
   * Optimised implementation for adding all elements from another FastTIntArrayList.
   * @param other
   * @return True if the collection was modified, false otherwise
   * @java FastTIntArrayList.addAll(FastTIntArrayList)
   */
  public addAll(other: FastTIntArrayList): boolean {
    const numToAdd = other.size();
    this.ensureCapacity(this._pos + numToAdd);
    for (let i = 0; i < numToAdd; i++) {
      this._data[this._pos + i] = other._data[i]!;
    }
    this._pos += numToAdd;
    return numToAdd > 0;
  }

  //-------------------------------------------------------------------------
}
