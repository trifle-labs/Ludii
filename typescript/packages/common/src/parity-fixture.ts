/**
 * Parity-test fixture helpers for the Ludii TypeScript port.
 *
 * ## Purpose
 *
 * When porting Java classes to TypeScript we want to verify that the port
 * produces **bit-for-bit identical** results to the Java original for a set of
 * representative inputs.  This module provides lightweight helpers for writing
 * those assertions.
 *
 * ## Workflow
 *
 * 1. Run the Java class and capture representative outputs (manually or via a
 *    small JUnit test that prints to stdout).
 * 2. Paste the captured values as `expectedValue` arguments inside a test
 *    file that uses {@link checkParity}.
 * 3. The test will fail if the TypeScript implementation drifts from the Java
 *    original.
 *
 * ## Example
 *
 * ```typescript
 * import { checkParity, checkParityBigInt } from "../src/parity-fixture.js";
 *
 * // Values captured from the Java run:
 * checkParity("FVector.softmax([1,2,3])[2]", 0.6652409076690674, result[2]);
 * checkParityBigInt("ZobristHashGenerator.next() #1", 0xDEADBEEFCAFEn, gen.next());
 * ```
 */

import assert from "node:assert/strict";

/**
 * Asserts that `actual` deeply equals `expected` and emits a labelled error
 * if they differ, making it easy to identify which Java → TS parity check
 * failed.
 *
 * @param label    Human-readable description shown in the failure message.
 * @param expected The value captured from the reference Java implementation.
 * @param actual   The value produced by the TypeScript port.
 */
export function checkParity<T>(label: string, expected: T, actual: T): void {
  assert.deepEqual(
    actual,
    expected,
    `Parity failure: ${label}\n  expected: ${String(expected)}\n  actual:   ${String(actual)}`,
  );
}

/**
 * Specialised variant of {@link checkParity} for `bigint` values, which need
 * hex display for readability.  Both `expected` and `actual` are compared as
 * signed 64-bit values (matching Java `long`).
 *
 * @param label    Human-readable description.
 * @param expected The 64-bit value captured from Java.
 * @param actual   The value produced by the TypeScript port.
 */
export function checkParityBigInt(
  label: string,
  expected: bigint,
  actual: bigint,
): void {
  assert.equal(
    actual,
    expected,
    `Parity failure (bigint): ${label}\n  expected: ${expected} (0x${(expected < 0n ? expected + (1n << 64n) : expected).toString(16).toUpperCase()})\n  actual:   ${actual} (0x${(actual < 0n ? actual + (1n << 64n) : actual).toString(16).toUpperCase()})`,
  );
}

/**
 * Asserts that `actual` and `expected` are within `epsilon` of each other.
 * Use this for floating-point values where rounding may differ by an ULP
 * between Java and TypeScript.
 *
 * @param label    Human-readable description.
 * @param expected The float captured from Java.
 * @param actual   The value produced by the TypeScript port.
 * @param epsilon  Maximum allowed absolute difference (default 1e-9).
 */
export function checkParityFloat(
  label: string,
  expected: number,
  actual: number,
  epsilon = 1e-9,
): void {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= epsilon,
    `Parity failure (float): ${label}\n  expected: ${expected}\n  actual:   ${actual}\n  diff:     ${diff} (epsilon: ${epsilon})`,
  );
}

/**
 * Asserts that two `BigInt64Array` instances contain identical values.
 *
 * @param label    Human-readable description.
 * @param expected The array captured from Java.
 * @param actual   The array produced by the TypeScript port.
 */
export function checkParityBigIntArray(
  label: string,
  expected: BigInt64Array,
  actual: BigInt64Array,
): void {
  assert.equal(
    actual.length,
    expected.length,
    `Parity failure (array length): ${label}`,
  );
  for (let i = 0; i < expected.length; i += 1) {
    assert.equal(
      actual[i],
      expected[i],
      `Parity failure (array[${i}]): ${label}`,
    );
  }
}
