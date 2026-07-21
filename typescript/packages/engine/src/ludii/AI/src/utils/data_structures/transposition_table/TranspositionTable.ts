// @java AI/src/utils/data_structures/transposition_table/TranspositionTable.java

/**
 * Transposition table for Alpha-Beta search.
 *
 * @java utils/data_structures/transposition_table/TranspositionTable.java
 * @author Dennis Soemers
 */

/** @java other.move.Move */
type Move = object;

//-------------------------------------------------------------------------

/**
 * Data we wish to store in TT entries for Alpha-Beta Search.
 *
 * @java utils.data_structures.transposition_table.TranspositionTable.ABTTData
 */
export class ABTTData {
  /** @java ABTTData.bestMove */
  public bestMove: Move | null = null;

  /** @java ABTTData.fullHash */
  public fullHash: bigint = BigInt(-1);

  /** @java ABTTData.value */
  public value: number = NaN;

  /** @java ABTTData.depth */
  public depth: number = -1;

  /** @java ABTTData.valueType */
  public valueType: number = TranspositionTable.INVALID_VALUE;

  /**
   * Constructor
   * @java ABTTData(Move, long, float, int, byte)
   */
  public constructor(
    bestMove: Move | null,
    fullHash: bigint,
    value: number,
    depth: number,
    valueType: number
  ) {
    this.bestMove = bestMove;
    this.fullHash = fullHash;
    this.value = value;
    this.depth = depth;
    this.valueType = valueType;
  }
}

/**
 * An entry in a Transposition Table for Alpha-Beta. Every entry contains two slots.
 *
 * @java utils.data_structures.transposition_table.TranspositionTable.ABTTEntry
 */
export class ABTTEntry {
  /** @java ABTTEntry.data1 */
  public data1: ABTTData | null = null;
  /** @java ABTTEntry.data2 */
  public data2: ABTTData | null = null;
}

/**
 * Transposition table for Alpha-Beta search.
 *
 * @java utils.data_structures.transposition_table.TranspositionTable
 */
export class TranspositionTable {

  //-------------------------------------------------------------------------

  /** An invalid value stored in Transposition Table */
  public static readonly INVALID_VALUE: number = 0x0;
  /** An exact (maybe heuristic) value stored in Transposition Table */
  public static readonly EXACT_VALUE: number = 0x1;
  /** A lower bound stored in Transposition Table */
  public static readonly LOWER_BOUND: number = 0x1 << 1;
  /** A upper bound stored in Transposition Table */
  public static readonly UPPER_BOUND: number = 0x1 << 2;

  //-------------------------------------------------------------------------

  /** @java TranspositionTable.numBitsPrimaryCode */
  private readonly numBitsPrimaryCode: number;

  /** @java TranspositionTable.maxNumEntries */
  private readonly maxNumEntries: number;

  /** @java TranspositionTable.table */
  private table: (ABTTEntry | null)[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor. NOTE: does not yet allocate memory!
   * @param numBitsPrimaryCode Number of bits from hashes to use as primary code.
   * @java TranspositionTable(int)
   */
  public constructor(numBitsPrimaryCode: number) {
    this.numBitsPrimaryCode = numBitsPrimaryCode;
    this.maxNumEntries = 1 << numBitsPrimaryCode;
    this.table = null;
  }

  //-------------------------------------------------------------------------

  /**
   * Allocates a brand new table with space for 2^(numBitsPrimaryCode) entries.
   * @java TranspositionTable.allocate()
   */
  public allocate(): void {
    this.table = new Array(this.maxNumEntries).fill(null);
  }

  /**
   * Clears up all memory of our table.
   * @java TranspositionTable.deallocate()
   */
  public deallocate(): void {
    this.table = null;
  }

  /**
   * @param fullHash
   * @return Stored data for given full hash (full 64bits code), or null if not found
   * @java TranspositionTable.retrieve(long)
   */
  public retrieve(fullHash: bigint): ABTTData | null {
    const table = this.table!;
    // Use upper numBitsPrimaryCode bits as index
    // Java: (int) (fullHash >>> (Long.SIZE - numBitsPrimaryCode))
    const idx = Number(BigInt.asUintN(32, fullHash >> BigInt(64 - this.numBitsPrimaryCode)));
    const entry = table[idx] ?? null;
    if (entry === null) return null;
    if (entry.data1 !== null && entry.data1.fullHash === fullHash) return entry.data1;
    if (entry.data2 !== null && entry.data2.fullHash === fullHash) return entry.data2;
    return null;
  }

  /**
   * Stores new data for given full hash (full 64bits code).
   * @java TranspositionTable.store(Move, long, float, int, byte)
   */
  public store(
    bestMove: Move | null,
    fullHash: bigint,
    value: number,
    depth: number,
    valueType: number
  ): void {
    const table = this.table!;
    const idx = Number(BigInt.asUintN(32, fullHash >> BigInt(64 - this.numBitsPrimaryCode)));
    let entry = table[idx] ?? null;

    if (entry === null) {
      entry = new ABTTEntry();
      entry.data1 = new ABTTData(bestMove, fullHash, value, depth, valueType);
      table[idx] = entry;
    } else {
      // See if we have empty slots in data
      if (entry.data1 === null) {
        entry.data1 = new ABTTData(bestMove, fullHash, value, depth, valueType);
        return;
      } else if (entry.data2 === null) {
        entry.data2 = new ABTTData(bestMove, fullHash, value, depth, valueType);
        return;
      }

      // Check if one of them has an identical full hash value, and if so,
      // prefer data with largest search depth
      if (entry.data1.fullHash === fullHash) {
        if (depth > entry.data1.depth) {
          entry.data1.bestMove = bestMove;
          entry.data1.depth = depth;
          entry.data1.fullHash = fullHash;
          entry.data1.value = value;
          entry.data1.valueType = valueType;
        }
        return;
      } else if (entry.data2.fullHash === fullHash) {
        if (depth > entry.data2.depth) {
          entry.data2.bestMove = bestMove;
          entry.data2.depth = depth;
          entry.data2.fullHash = fullHash;
          entry.data2.value = value;
          entry.data2.valueType = valueType;
        }
        return;
      }

      // Both slots already filled, so replace whichever has the lowest depth
      if (entry.data1.depth < entry.data2.depth) {
        entry.data1.bestMove = bestMove;
        entry.data1.depth = depth;
        entry.data1.fullHash = fullHash;
        entry.data1.value = value;
        entry.data1.valueType = valueType;
      } else if (entry.data2.depth < entry.data1.depth) {
        entry.data2.bestMove = bestMove;
        entry.data2.depth = depth;
        entry.data2.fullHash = fullHash;
        entry.data2.value = value;
        entry.data2.valueType = valueType;
      } else {
        // Both existing slots have equal search depth, move data from 1 to 2 and then replace 1
        entry.data2.bestMove = entry.data1.bestMove;
        entry.data2.depth = entry.data1.depth;
        entry.data2.fullHash = entry.data1.fullHash;
        entry.data2.value = entry.data1.value;
        entry.data2.valueType = entry.data1.valueType;

        entry.data1.bestMove = bestMove;
        entry.data1.depth = depth;
        entry.data1.fullHash = fullHash;
        entry.data1.value = value;
        entry.data1.valueType = valueType;
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java TranspositionTable.nbEntries()
   */
  public nbEntries(): number {
    const table = this.table!;
    let res = 0;
    for (let i = 0; i < this.maxNumEntries; i++) {
      if ((table[i] ?? null) !== null) res += 1;
    }
    return res;
  }

  /**
   * @java TranspositionTable.dispValueStats()
   */
  public dispValueStats(): void {
    const table = this.table!;
    let maxDepth = 0;
    for (let i = 0; i < this.maxNumEntries; i++) {
      const entry = table[i] ?? null;
      if (entry !== null) {
        if (entry.data1 !== null) {
          if (entry.data1.depth > maxDepth) maxDepth = entry.data1.depth;
        }
        if (entry.data2 !== null) {
          if (entry.data2.depth > maxDepth) maxDepth = entry.data2.depth;
        }
      }
    }

    const counters: number[][] = [];
    for (let i = 0; i <= maxDepth; ++i) {
      counters.push(new Array(6).fill(0));
    }

    for (let i = 0; i < this.maxNumEntries; i++) {
      const entry = table[i] ?? null;
      if (entry !== null) {
        if (entry.data1 !== null) {
          let index = entry.data1.valueType;
          switch (index) {
            case 0: break;
            case 1: break;
            case 2: break;
            case 4: break;
            default: index = 5;
          }
          counters[entry.data1.depth]![index]! += 1;
        }
        if (entry.data2 !== null) {
          let index = entry.data2.valueType;
          switch (index) {
            case 0: break;
            case 1: break;
            case 2: break;
            case 4: break;
            default: index = 5;
          }
          counters[entry.data2.depth]![index]! += 1;
        }
      }
    }

    console.log("Search tree analysis:");
    for (let i = 1; i < maxDepth; i++) {
      let line = "At depth " + i + ": ";
      for (const k of [0, 1, 2, 4]) {
        line += "value " + k + ": " + counters[i]![k] + ", ";
      }
      console.log(line);
    }
  }

  //-------------------------------------------------------------------------
}
