// @java Core/src/other/uf/UnionInfoD.java UnionInfoD
/**
 * Storage for the Union-Find-Delete data structure.
 *
 * Faithful 1:1 transliteration of other.uf.UnionInfoD.
 *
 * @author tahmina  (Java original)
 */

const UNUSED = -1;

/**
 * Union-Find with deletion support and liberty tracking.
 * @java other.uf.UnionInfoD
 */
export class UnionInfoD {
  // -------- fields ---------------------------------------------------------

  /** @java UnionInfoD#parent */
  protected readonly parent: Int32Array;

  /** @java UnionInfoD#itemsList */
  protected readonly itemsList: (boolean[] | null)[];

  /** @java UnionInfoD#itemWithOrthoNeighbors */
  protected readonly itemWithOrthoNeighbors: (boolean[] | null)[];

  /** @java UnionInfoD#totalsize */
  protected readonly totalsize: number;

  // -------- constructors ---------------------------------------------------

  /**
   * @java UnionInfoD(int totalElements, int numberOfPlayers, boolean blocking)
   */
  constructor(totalElements: number, numberOfPlayers: number, blocking: boolean);
  /**
   * Copy constructor.
   * @java UnionInfoD(UnionInfoD other)
   */
  constructor(other: UnionInfoD);

  constructor(
    argA: number | UnionInfoD,
    _numberOfPlayers?: number,
    blocking?: boolean,
  ) {
    if (argA instanceof UnionInfoD) {
      const other = argA;
      this.totalsize = other.totalsize;
      this.parent    = other.parent.slice();
      this.itemsList = other.itemsList.map(bs =>
        bs !== null ? [...bs] : null,
      );
      if (other.itemWithOrthoNeighbors !== null) {
        this.itemWithOrthoNeighbors = other.itemWithOrthoNeighbors.map(bs =>
          bs !== null ? [...bs] : null,
        );
      } else {
        this.itemWithOrthoNeighbors = [];
      }
    } else {
      const totalElements = argA;
      this.totalsize = totalElements;
      this.parent    = new Int32Array(totalElements).fill(UNUSED);
      this.itemsList = new Array<boolean[] | null>(totalElements).fill(null);
      this.itemWithOrthoNeighbors = new Array<boolean[] | null>(totalElements).fill(null);

      if (blocking === true) {
        // Blocking mode: one big group covering all positions
        const bs = new Array<boolean>(totalElements).fill(true);
        this.itemsList[0] = bs;
        // leave parent as UNUSED for all
      }
      // non-blocking: parent already UNUSED
    }
  }

  // -------- parent operations ----------------------------------------------

  /** @java UnionInfoD#setParent(int childIndex, int parentIndex) */
  setParent(childIndex: number, parentIndex: number): void {
    this.parent[childIndex] = parentIndex;
  }

  /** @java UnionInfoD#clearParent(int childIndex) */
  clearParent(childIndex: number): void {
    this.parent[childIndex] = UNUSED;
  }

  /** @java UnionInfoD#getParent(int childIndex) */
  getParent(childIndex: number): number {
    return this.parent[childIndex]!;
  }

  // -------- items list operations ------------------------------------------

  /** @java UnionInfoD#getItemsList(int parentIndex) */
  getItemsList(parentIndex: number): boolean[] {
    if (this.itemsList[parentIndex] === null || this.itemsList[parentIndex] === undefined) {
      this.itemsList[parentIndex] = new Array<boolean>(this.totalsize).fill(false);
    }
    return this.itemsList[parentIndex]!;
  }

  /** @java UnionInfoD#clearItemsList(int parentIndex) */
  clearItemsList(parentIndex: number): void {
    this.itemsList[parentIndex] = null;
  }

  /** @java UnionInfoD#isSameGroup(int parentIndex, int childIndex) */
  isSameGroup(parentIndex: number, childIndex: number): boolean {
    const bs = this.itemsList[parentIndex];
    if (bs === null || bs === undefined) return false;
    return bs[childIndex] === true;
  }

  /** @java UnionInfoD#setItem(int parentIndex, int childIndex) */
  setItem(parentIndex: number, childIndex: number): void {
    if (this.itemsList[parentIndex] === null || this.itemsList[parentIndex] === undefined) {
      this.itemsList[parentIndex] = new Array<boolean>(this.totalsize).fill(false);
    }
    this.itemsList[parentIndex]![childIndex] = true;
  }

  /** @java UnionInfoD#mergeItemsLists(int parentIndex1, int parentIndex2) */
  mergeItemsLists(parentIndex1: number, parentIndex2: number): void {
    const bs1 = this.getItemsList(parentIndex1);
    const bs2 = this.itemsList[parentIndex2];
    if (bs2 !== null && bs2 !== undefined) {
      for (let i = 0; i < bs2.length; i++) {
        if (bs2[i]) bs1[i] = true;
      }
    }
    this.itemsList[parentIndex2] = null;
  }

  /** @java UnionInfoD#getGroupSize(int parentIndex) */
  getGroupSize(parentIndex: number): number {
    const bs = this.itemsList[parentIndex];
    if (bs === null || bs === undefined) return 0;
    let count = 0;
    for (const b of bs) if (b) count++;
    return count;
  }

  // -------- ortho-neighbour operations (liberty) ---------------------------

  /** @java UnionInfoD#getAllItemWithOrthoNeighbors(int parentIndex) */
  getAllItemWithOrthoNeighbors(parentIndex: number): boolean[] {
    if (
      this.itemWithOrthoNeighbors[parentIndex] === null ||
      this.itemWithOrthoNeighbors[parentIndex] === undefined
    ) {
      this.itemWithOrthoNeighbors[parentIndex] = new Array<boolean>(this.totalsize).fill(false);
    }
    return this.itemWithOrthoNeighbors[parentIndex]!;
  }

  /** @java UnionInfoD#clearAllitemWithOrthoNeighbors(int parentIndex) */
  clearAllitemWithOrthoNeighbors(parentIndex: number): void {
    this.itemWithOrthoNeighbors[parentIndex] = null;
  }

  /** @java UnionInfoD#setItemWithOrthoNeighbors(int parentIndex, int childIndex) */
  setItemWithOrthoNeighbors(parentIndex: number, childIndex: number): void {
    if (
      this.itemWithOrthoNeighbors[parentIndex] === null ||
      this.itemWithOrthoNeighbors[parentIndex] === undefined
    ) {
      this.itemWithOrthoNeighbors[parentIndex] = new Array<boolean>(this.totalsize).fill(false);
    }
    this.itemWithOrthoNeighbors[parentIndex]![childIndex] = true;
  }

  /** @java UnionInfoD#mergeItemWithOrthoNeighbors(int parentIndex1, int parentIndex2) */
  mergeItemWithOrthoNeighbors(parentIndex1: number, parentIndex2: number): void {
    const bs1 = this.getAllItemWithOrthoNeighbors(parentIndex1);
    const bs2 = this.itemWithOrthoNeighbors[parentIndex2];
    if (bs2 !== null && bs2 !== undefined) {
      for (let i = 0; i < bs2.length; i++) {
        if (bs2[i]) bs1[i] = true;
      }
    }
    this.itemWithOrthoNeighbors[parentIndex2] = null;
  }
}
