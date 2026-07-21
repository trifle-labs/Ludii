// @java Core/src/other/state/zhash/ZobristHashUtilities.java

import { ZobristHashGenerator } from "./ZobristHashGenerator.js";

/**
 * Zobrist hashing — attempts to reduce a board state to a 64-bit number.
 * Faithful 1:1 port of ZobristHashUtilities.java.
 *
 * Basic contract:
 * - Same position in different parts of the tree should have the same hash.
 * - Different positions will have different hashes _most_ of the time.
 * - Fast to calculate via incremental updates.
 *
 * @author mrraow (Java), ported to TS
 */
export class ZobristHashUtilities {
  /** Initial value of a hash (0). Java: public static final long INITIAL_VALUE = 0L */
  static readonly INITIAL_VALUE = 0;

  /** Potentially useful value for signalling unknown hash. Java: public static final long UNKNOWN = -1L */
  static readonly UNKNOWN = -1;

  /**
   * @returns a new instance of a generator which will return a consistent set
   * of hashes across different runs.
   */
  static getHashGenerator(): ZobristHashGenerator {
    return new ZobristHashGenerator();
  }

  /**
   * @param generator sequence generator
   * @returns next number in sequence
   */
  static getNext(generator: ZobristHashGenerator): number {
    return generator.next();
  }

  /**
   * @param generator sequence generator
   * @param dim dimension of array
   * @returns 1d array of numbers from sequence
   */
  static getSequence(generator: ZobristHashGenerator, dim: number): number[];
  /**
   * @param generator sequence generator
   * @param dim1 first dimension of array
   * @param dim2 second dimension of array
   * @returns 2d array of numbers from sequence
   */
  static getSequence(generator: ZobristHashGenerator, dim1: number, dim2: number): number[][];
  /**
   * @param generator sequence generator
   * @param dim1 first dimension of array
   * @param dim2 second dimension of array
   * @param dim3 third dimension of array
   * @returns 3d array of numbers from sequence
   */
  static getSequence(generator: ZobristHashGenerator, dim1: number, dim2: number, dim3: number): number[][][];
  static getSequence(
    generator: ZobristHashGenerator,
    dim1: number,
    dim2?: number,
    dim3?: number,
  ): number[] | number[][] | number[][][] {
    if (dim2 === undefined) {
      const results: number[] = new Array(dim1);
      for (let i = 0; i < dim1; i++) results[i] = generator.next();
      return results;
    }
    if (dim3 === undefined) {
      const results: number[][] = new Array(dim1);
      for (let i = 0; i < dim1; i++) results[i] = ZobristHashUtilities.getSequence(generator, dim2) as number[];
      return results;
    }
    const results: number[][][] = new Array(dim1);
    for (let i = 0; i < dim1; i++) results[i] = ZobristHashUtilities.getSequence(generator, dim2, dim3) as number[][];
    return results;
  }
}
