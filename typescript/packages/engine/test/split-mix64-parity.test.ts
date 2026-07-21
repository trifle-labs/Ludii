/**
 * SplitMix64 Java parity tests.
 *
 * Expected values were produced by running:
 *   java SplitMix64Verify <bytes>
 * against org.apache.commons.rng.core.source64.SplitMix64 (Apache Commons RNG)
 * found in Common/lib/Trove4j_ApacheCommonsRNG.jar.
 *
 * Source: /tmp/splitfix/SplitMix64Verify.java — prints nextLong() x10,
 * nextInt(6) x10, and nextInt() x10 for a given 8-byte RNG state.
 *
 * Two test vectors:
 *   A) bytes = [-26,-78,10,-120,127,125,-59,9]
 *      (from Player/res/random_trials/board/race/reach/Kos/RandomTrial_0.txt)
 *   B) bytes = [119,18,-81,-51,95,-1,-122,103]
 *      (from Player/res/random_trials/board/race/reach/Sig wa Duqqan .../RandomTrial_0.txt)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SplitMix64 } from "../src/eval/split-mix64.js";

// ---------------------------------------------------------------------------
// Vector A: Kos/RandomTrial_0.txt → RNG internal state=-26,-78,10,-120,127,125,-59,9
// ---------------------------------------------------------------------------
const BYTES_A: readonly number[] = [-26, -78, 10, -120, 127, 125, -59, 9];

// Java output: initialState=704106903450071782
// Confirmed: BigInt little-endian decode = same value.

describe("SplitMix64 Java parity — vector A (Kos RandomTrial_0)", () => {
  it("initial state value", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    // little-endian: bytes[-26,-78,10,-120,127,125,-59,9] = 0x09C57D7F88_0A_B2_E6 ... let the impl compute
    // We check indirectly by checking the first nextLong matches Java.
    const first = rng.nextLong();
    assert.equal(first, 5508460638033748896n);
  });

  it("nextLong() x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    const expected: bigint[] = [
      5508460638033748896n,
      -4443781981248551505n,
      7596470392727905440n,
      5671891451599441362n,
      7115516629440832616n,
      638154927846537409n,
      424088166431087859n,
      -8479725313639938532n,
      -8308392785829809996n,
      -8285299652440443166n,
    ];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextLong();
      assert.equal(got, expected[i], `nextLong[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("nextInt(6) x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    // Java: nextInt(6) x10 = [3,1,3,5,2,5,3,2,5,5]
    const expected = [3, 1, 3, 5, 2, 5, 3, 2, 5, 5];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextIntBound(6);
      assert.equal(got, expected[i], `nextInt(6)[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("nextInt() x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    // Java: nextInt() x10
    const expected = [
      -1454843805,
      -835549574,
      1614655795,
      664688363,
      -1584676668,
      -1859250617,
      -999230205,
      -1110740771,
      2122356851,
      -2087058113,
    ];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextInt();
      assert.equal(got, expected[i], `nextInt[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Vector B: Sig wa Duqqan (Houmt Taourit)/RandomTrial_0.txt
//           RNG internal state=119,18,-81,-51,95,-1,-122,103
// ---------------------------------------------------------------------------
const BYTES_B: readonly number[] = [119, 18, -81, -51, 95, -1, -122, 103];

describe("SplitMix64 Java parity — vector B (Sig wa Duqqan RandomTrial_0)", () => {
  it("nextLong() x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_B);
    const expected: bigint[] = [
      -7764155939365142614n,
      -7201068967981178327n,
      7668490793572775867n,
      5203642240067053805n,
      4669611523207152377n,
      8544681641384125155n,
      6928037069525757958n,
      7451243724381761253n,
      -6174240801250623284n,
      6661116938819668073n,
    ];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextLong();
      assert.equal(got, expected[i], `nextLong[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("nextInt(6) x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_B);
    // Java: nextInt(6) x10 = [0,0,0,0,0,4,0,2,4,4]
    const expected = [0, 0, 0, 0, 0, 4, 0, 2, 4, 4];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextIntBound(6);
      assert.equal(got, expected[i], `nextInt(6)[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("nextInt() x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_B);
    const expected = [
      -1591307547,
      -1401680956,
      942261252,
      1365059041,
      -820475895,
      387214413,
      1207395588,
      969542741,
      -2115276680,
      232653561,
    ];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextInt();
      assert.equal(got, expected[i], `nextInt[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Vector C: 20 Squares/RandomTrial_1.txt
//           RNG internal state=-101,90,-17,-38,-127,104,-19,14
// Critical test: power-of-two bounds (d=4, d=2) hit the fast path in
// BaseProvider.nextInt(int) which uses (long)n * bits31 >> 31 arithmetic.
// An earlier bug (Math.imul 32-bit overflow) caused wrong results for
// power-of-two bounds; this vector catches that regression.
// ---------------------------------------------------------------------------
const BYTES_C: readonly number[] = [-101, 90, -17, -38, -127, 104, -19, 14];

describe("SplitMix64 Java parity — vector C (20 Squares power-of-two bounds)", () => {
  it("nextIntBound(4) x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_C);
    // Java: nextInt(4) x10 = [2,1,1,1,2,0,2,2,1,2]
    const expected = [2, 1, 1, 1, 2, 0, 2, 2, 1, 2];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextIntBound(4);
      assert.equal(got, expected[i], `nextIntBound(4)[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("nextIntBound(2) x10 matches Java", () => {
    const rng = SplitMix64.fromBytes(BYTES_C);
    // Java: nextInt(2) x10 = [1,0,0,0,1,0,1,1,0,1]
    const expected = [1, 0, 0, 0, 1, 0, 1, 1, 0, 1];
    for (let i = 0; i < 10; i++) {
      const got = rng.nextIntBound(2);
      assert.equal(got, expected[i], `nextIntBound(2)[${i}]: expected ${expected[i]}, got ${got}`);
    }
  });

  it("alternating nextIntBound(4)+nextIntBound(2) pairs match Java (20 Squares dice sequence)", () => {
    const rng = SplitMix64.fromBytes(BYTES_C);
    // Java: pairs [die0,die1] = [[2,0],[1,0],[2,0],[2,1],[1,1]]
    const expected = [[2,0],[1,0],[2,0],[2,1],[1,1]] as const;
    for (let i = 0; i < 5; i++) {
      const d0 = rng.nextIntBound(4);
      const d1 = rng.nextIntBound(2);
      assert.equal(d0, expected[i]![0], `pair[${i}] die0: expected ${expected[i]![0]}, got ${d0}`);
      assert.equal(d1, expected[i]![1], `pair[${i}] die1: expected ${expected[i]![1]}, got ${d1}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Structural tests
// ---------------------------------------------------------------------------
describe("SplitMix64 structural", () => {
  it("fromBytes rejects wrong length", () => {
    assert.throws(() => SplitMix64.fromBytes([1, 2, 3]), /expected 8 bytes/);
  });

  it("clone is independent", () => {
    const a = SplitMix64.fromBytes(BYTES_A);
    const b = a.clone();
    // Advance a
    a.nextLong();
    // b should still produce the same first value as the original a
    assert.equal(b.nextLong(), 5508460638033748896n);
  });

  it("nextIntBound(1) always returns 0", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    for (let i = 0; i < 20; i++) {
      assert.equal(rng.nextIntBound(1), 0);
    }
  });

  it("nextIntBound result is in [0, bound)", () => {
    const rng = SplitMix64.fromBytes(BYTES_A);
    for (const bound of [2, 3, 4, 6, 7, 8, 100]) {
      for (let i = 0; i < 20; i++) {
        const v = rng.nextIntBound(bound);
        assert.ok(v >= 0 && v < bound, `bound=${bound} got ${v}`);
      }
    }
  });
});
