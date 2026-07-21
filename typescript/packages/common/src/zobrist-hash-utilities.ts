/**
 * TypeScript port of Zobrist hash utilities.
 *
 * Java source: `Core/src/other/state/zhash/ZobristHashUtilities.java`
 *
 * Provides factory methods that allocate pre-filled arrays of hash values
 * drawn from a {@link ZobristHashGenerator} sequence.  The arrays are reused
 * across clones of the same game state so mutation is the caller's
 * responsibility.
 */

import { ZobristHashGenerator } from "./zobrist-hash-generator.js";

/** Initial value of an empty Zobrist hash. */
export const INITIAL_VALUE = 0n;

/** Sentinel value indicating an unknown or uninitialised hash. */
export const UNKNOWN = -1n; // Java long -1L

/**
 * Returns a fresh {@link ZobristHashGenerator} seeded with the same constant
 * that the Java implementation uses, so hash sequences are reproducible
 * across platforms.
 */
export function getHashGenerator(): ZobristHashGenerator {
  return new ZobristHashGenerator();
}

/**
 * Draws `dim` values from `generator` and returns them as a `BigInt64Array`.
 */
export function getSequence(
  generator: ZobristHashGenerator,
  dim: number,
): BigInt64Array;
/**
 * Draws `dim1 × dim2` values from `generator` and returns a 2-D array of
 * `BigInt64Array` rows.
 */
export function getSequence(
  generator: ZobristHashGenerator,
  dim1: number,
  dim2: number,
): BigInt64Array[];
/**
 * Draws `dim1 × dim2 × dim3` values from `generator` and returns a 3-D
 * array.
 */
export function getSequence(
  generator: ZobristHashGenerator,
  dim1: number,
  dim2: number,
  dim3: number,
): BigInt64Array[][];
export function getSequence(
  generator: ZobristHashGenerator,
  dim1: number,
  dim2?: number,
  dim3?: number,
): BigInt64Array | BigInt64Array[] | BigInt64Array[][] {
  if (dim2 === undefined) {
    const results = new BigInt64Array(dim1);
    for (let i = 0; i < dim1; i += 1) {
      results[i] = generator.next();
    }
    return results;
  }

  if (dim3 === undefined) {
    const results: BigInt64Array[] = [];
    for (let i = 0; i < dim1; i += 1) {
      results.push(getSequence(generator, dim2));
    }
    return results;
  }

  const results: BigInt64Array[][] = [];
  for (let i = 0; i < dim1; i += 1) {
    results.push(getSequence(generator, dim2, dim3) as BigInt64Array[]);
  }
  return results;
}

/**
 * Returns a single value from `generator` (convenience wrapper around
 * `generator.next()`).
 */
export function getNext(generator: ZobristHashGenerator): bigint {
  return generator.next();
}
