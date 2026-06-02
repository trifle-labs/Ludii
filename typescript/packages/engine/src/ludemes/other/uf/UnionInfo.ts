// @java Core/src/other/uf/UnionInfo.java UnionInfo
/**
 * Storage for the Union-Find data structure.
 *
 * Faithful 1:1 transliteration of other.uf.UnionInfo.
 *
 * @author tahmina  (Java original)
 */

/**
 * Rank-based union-find with a BitSet items list per root.
 * @java other.uf.UnionInfo
 */
export class UnionInfo {
  // -------- fields ---------------------------------------------------------

  /** @java UnionInfo#parent */
  protected readonly parent: Int32Array;

  /** @java UnionInfo#itemsList — BitSet[] simulated as boolean[][] (sparse) */
  protected readonly itemsList: (boolean[] | null)[];

  /** @java UnionInfo#totalsize */
  protected readonly totalsize: number;

  // -------- constructor ----------------------------------------------------

  /**
   * @java UnionInfo(int totalElements)
   */
  constructor(totalElements: number);

  /**
   * Copy constructor.
   * @java UnionInfo(UnionInfo other)
   */
  constructor(other: UnionInfo);

  constructor(arg: number | UnionInfo) {
    if (typeof arg === "number") {
      this.totalsize = arg;
      this.parent    = new Int32Array(arg);
      this.itemsList = new Array<boolean[] | null>(arg).fill(null);
      for (let i = 0; i < arg; i++) {
        this.parent[i] = i;
      }
    } else {
      // copy constructor
      this.totalsize = arg.totalsize;
      this.parent    = arg.parent.slice();
      this.itemsList = arg.itemsList.map(bs =>
        bs !== null ? [...bs] : null,
      );
    }
  }

  // -------- parent operations ----------------------------------------------

  /** @java UnionInfo#setParent(int childIndex, int parentIndex) */
  setParent(childIndex: number, parentIndex: number): void {
    this.parent[childIndex] = parentIndex;
  }

  /** @java UnionInfo#getParent(int childIndex) */
  getParent(childIndex: number): number {
    return this.parent[childIndex]!;
  }

  // -------- items list operations ------------------------------------------

  /** @java UnionInfo#getItemsList(int parentIndex) */
  getItemsList(parentIndex: number): boolean[] | null {
    return this.itemsList[parentIndex] ?? null;
  }

  /**
   * Add childIndex to the items set of parentIndex (creates set if absent).
   * @java UnionInfo#setItem(int parentIndex, int childIndex)
   */
  setItem(parentIndex: number, childIndex: number): void {
    if (this.itemsList[parentIndex] === null || this.itemsList[parentIndex] === undefined) {
      this.itemsList[parentIndex] = new Array<boolean>(this.totalsize).fill(false);
    }
    this.itemsList[parentIndex]![childIndex] = true;
  }

  /**
   * Merge the items set of parentIndex2 into parentIndex1 and clear parentIndex2.
   * @java UnionInfo#mergeItemsLists(int parentIndex1, int parentIndex2)
   */
  mergeItemsLists(parentIndex1: number, parentIndex2: number): void {
    const bs1 = this.itemsList[parentIndex1];
    const bs2 = this.itemsList[parentIndex2];
    if (bs1 !== null && bs1 !== undefined && bs2 !== null && bs2 !== undefined) {
      for (let i = 0; i < bs2.length; i++) {
        if (bs2[i]) bs1[i] = true;
      }
    }
    this.itemsList[parentIndex2] = null;
    // also set in case bs1 was null
    if ((this.itemsList[parentIndex1] === null || this.itemsList[parentIndex1] === undefined) && bs2 !== null && bs2 !== undefined) {
      this.itemsList[parentIndex1] = [...bs2];
    }
  }

  /**
   * @java UnionInfo#isSameGroup(int parentIndex, int childIndex)
   */
  isSameGroup(parentIndex: number, childIndex: number): boolean {
    const bs = this.itemsList[parentIndex];
    if (bs === null || bs === undefined) return false;
    return bs[childIndex] === true;
  }

  /**
   * @java UnionInfo#getGroupSize(int parentIndex)
   */
  getGroupSize(parentIndex: number): number {
    const bs = this.itemsList[parentIndex];
    if (bs === null || bs === undefined) return 0;
    let count = 0;
    for (const b of bs) if (b) count++;
    return count;
  }
}
