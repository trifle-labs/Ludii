// @java AI/src/utils/data_structures/transposition_table/TranspositionTableUBFM.java

/**
 * Transposition table for Unbounded Best-First Minimax. Works as a hash table, where the beginning
 * of the hash code points to an entry which contains a list of data.
 *
 * @java utils/data_structures/transposition_table/TranspositionTableUBFM.java
 * @author cyprien
 */

// Escape-hatch type for ScoredMove (not yet ported)
/** @java utils.data_structures.ScoredMove */
export type ScoredMove = {
  move: unknown;
  score: number;
  nbVisits: number;
};

//-------------------------------------------------------------------------

/**
 * Data we wish to store in TT entries for UBFM.
 *
 * @java utils.data_structures.transposition_table.TranspositionTableUBFM.UBFMTTData
 */
export class UBFMTTData {
  /** @java UBFMTTData.fullHash */
  public fullHash: bigint = BigInt(-1);

  /** @java UBFMTTData.value */
  public value: number = NaN;

  /** @java UBFMTTData.depth */
  public depth: number = -1;

  /** @java UBFMTTData.valueType */
  public valueType: number = TranspositionTableUBFM.INVALID_VALUE;

  /** @java UBFMTTData.sortedScoredMoves */
  public sortedScoredMoves: ScoredMove[] | null = null;

  /**
   * Constructor
   * @java UBFMTTData(long, float, int, byte, List)
   */
  public constructor(
    fullHash: bigint,
    value: number,
    depth: number,
    valueType: number,
    sortedScoredMoves: ScoredMove[] | null
  ) {
    this.fullHash = fullHash;
    this.value = value;
    this.depth = depth;
    this.valueType = valueType;
    this.sortedScoredMoves = sortedScoredMoves;
  }
}

/**
 * An entry in a Transposition Table for UBFM. Every entry can contain any number of slots.
 *
 * @java utils.data_structures.transposition_table.TranspositionTableUBFM.UBFMTTEntry
 */
export class UBFMTTEntry {
  /** @java UBFMTTEntry.data */
  public data: UBFMTTData[] = [];

  public constructor() {
    // initial capacity 3 as in Java
  }
}

/**
 * Transposition table for Unbounded Best-First Minimax.
 *
 * @java utils.data_structures.transposition_table.TranspositionTableUBFM
 */
export class TranspositionTableUBFM {

  //-------------------------------------------------------------------------

  /** An invalid value stored in Transposition Table */
  public static readonly INVALID_VALUE: number = 0x0;
  /** An exact (maybe heuristic) value stored in Transposition Table */
  public static readonly EXACT_VALUE: number = 0x1;
  /** An exact value marked (only used by the heuristic learning code) */
  public static readonly MARKED: number = 0x1 << 1;
  /** An exact value validated (only used by the heuristic learning code) */
  public static readonly VALIDATED: number = 0x1 << 2;

  //-------------------------------------------------------------------------

  /** @java TranspositionTableUBFM.numBitsPrimaryCode */
  private readonly numBitsPrimaryCode: number;

  /** @java TranspositionTableUBFM.maxNumEntries */
  private readonly maxNumEntries: number;

  /** @java TranspositionTableUBFM.table */
  private table: (UBFMTTEntry | null)[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor. NOTE: does not yet allocate memory!
   * @param numBitsPrimaryCode Number of bits from hashes to use as primary code.
   * @java TranspositionTableUBFM(int)
   */
  public constructor(numBitsPrimaryCode: number) {
    this.numBitsPrimaryCode = numBitsPrimaryCode;
    this.maxNumEntries = 1 << numBitsPrimaryCode;
    this.table = null;
  }

  //-------------------------------------------------------------------------

  /**
   * Allocates a brand new table with space for 2^(numBitsPrimaryCode) entries.
   * @java TranspositionTableUBFM.allocate()
   */
  public allocate(): void {
    this.table = new Array(this.maxNumEntries).fill(null);
  }

  /**
   * Clears up all memory of our table.
   * @java TranspositionTableUBFM.deallocate()
   */
  public deallocate(): void {
    this.table = null;
  }

  /**
   * Return true if and only if the table is allocated.
   * @java TranspositionTableUBFM.isAllocated()
   */
  public isAllocated(): boolean {
    return this.table !== null;
  }

  /**
   * @param fullHash
   * @return Stored data for given full hash (full 64bits code), or null if not found
   * @java TranspositionTableUBFM.retrieve(long)
   */
  public retrieve(fullHash: bigint): UBFMTTData | null {
    const table = this.table!;
    const idx = Number(BigInt.asUintN(32, fullHash >> BigInt(64 - this.numBitsPrimaryCode)));
    const entry = table[idx] ?? null;
    if (entry !== null) {
      for (const data of entry.data) {
        if (data.fullHash === fullHash) return data;
      }
    }
    return null;
  }

  /**
   * Stores new data for given full hash (full 64bits code).
   * @java TranspositionTableUBFM.store(long, float, int, byte, List)
   */
  public store(
    fullHash: bigint,
    value: number,
    depth: number,
    valueType: number,
    sortedScoredMoves: ScoredMove[] | null
  ): void {
    const table = this.table!;
    const idx = Number(BigInt.asUintN(32, fullHash >> BigInt(64 - this.numBitsPrimaryCode)));
    let entry = table[idx] ?? null;

    if (entry === null) {
      entry = new UBFMTTEntry();
      entry.data.push(new UBFMTTData(fullHash, value, depth, valueType, sortedScoredMoves));
      table[idx] = entry;
    } else {
      const dataToSave = new UBFMTTData(fullHash, value, depth, valueType, sortedScoredMoves);

      // We erase a previous entry if it has the same fullHash
      for (let i = 0; i < entry.data.length; i++) {
        const data = entry.data[i]!;
        if (data.fullHash === fullHash) {
          entry.data[i] = dataToSave;
          return;
        }
      }

      // If we arrive to this point it means that we had no previous data about this fullHash
      entry.data.push(dataToSave);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java TranspositionTableUBFM.nbEntries()
   */
  public nbEntries(): number {
    const table = this.table!;
    let res = 0;
    for (let i = 0; i < this.maxNumEntries; i++) {
      if (table[i] !== null) res += table[i]!.data.length;
    }
    return res;
  }

  /**
   * @java TranspositionTableUBFM.nbMarkedEntries()
   */
  public nbMarkedEntries(): number {
    const table = this.table!;
    let res = 0;
    for (let i = 0; i < this.maxNumEntries; i++) {
      if (table[i] !== null) {
        for (const entry of table[i]!.data) {
          if (entry.valueType === TranspositionTableUBFM.MARKED) res += 1;
        }
      }
    }
    return res;
  }

  /**
   * @java TranspositionTableUBFM.dispValueStats()
   */
  public dispValueStats(): void {
    const table = this.table!;

    console.log("Number of entries:" + this.nbEntries().toString());

    let maxDepth = 0;
    for (let i = 0; i < this.maxNumEntries; i++) {
      if (table[i] !== null) {
        for (const data of table[i]!.data) {
          if (data.depth > maxDepth) maxDepth = data.depth;
        }
      }
    }

    const counters: number[][] = [];
    for (let i = 0; i <= maxDepth; ++i) {
      counters.push(new Array(7).fill(0));
    }

    for (let i = 0; i < this.maxNumEntries; i++) {
      if (table[i] !== null) {
        for (const data of table[i]!.data) {
          let index = data.valueType;
          switch (index) {
            case 0: break;
            case 1: break;
            case 2: break;
            case 4: index = 3; break;
            case 8: index = 4; break;
            case 16: index = 5; break;
            default: index = 6;
          }
          counters[data.depth]![index]! += 1;
        }
      }
    }

    console.log("Search tree analysis:");
    for (let i = 0; i < maxDepth; i++) {
      let line = "At depth " + i + ": ";
      for (const k of [0, 1, 2, 4, 5, 6]) {
        line += "value " + k + ": " + counters[i]![k] + ", ";
      }
      console.log(line);
    }
  }

  //-------------------------------------------------------------------------
}
