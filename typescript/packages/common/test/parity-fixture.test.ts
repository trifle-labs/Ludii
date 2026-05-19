import assert from "node:assert/strict";
import test from "node:test";

import {
  checkParity,
  checkParityBigInt,
  checkParityBigIntArray,
  checkParityFloat,
} from "../src/index.js";

test("checkParity passes when values are deeply equal", () => {
  assert.doesNotThrow(() => checkParity("number", 42, 42));
  assert.doesNotThrow(() => checkParity("string", "hello", "hello"));
  assert.doesNotThrow(() => checkParity("array", [1, 2, 3], [1, 2, 3]));
});

test("checkParity throws on mismatch with the label in the message", () => {
  assert.throws(() => checkParity("my-label", 1, 2), /my-label/);
});

test("checkParityBigInt passes for equal bigint values", () => {
  assert.doesNotThrow(() =>
    checkParityBigInt("hash", 0xdeadbeefn, 0xdeadbeefn),
  );
  // Works with negative (signed) values too
  assert.doesNotThrow(() => checkParityBigInt("hash-neg", -1n, -1n));
});

test("checkParityBigInt fails for differing bigint values and shows hex", () => {
  assert.throws(() => checkParityBigInt("hash", 0xdeadbeefn, 0xcafen), /hash/);
});

test("checkParityFloat passes within epsilon", () => {
  // Simulate a value captured from Java that may differ slightly from TS
  assert.doesNotThrow(() => checkParityFloat("approx", 1.00000001, 1.0, 1e-6));
});

test("checkParityFloat fails outside epsilon and includes diff in message", () => {
  assert.throws(() => checkParityFloat("pi", 1.0, 2.0, 0.5), /diff/);
});

test("checkParityBigIntArray passes for equal arrays", () => {
  const a = new BigInt64Array([1n, 2n, 3n]);
  const b = new BigInt64Array([1n, 2n, 3n]);
  assert.doesNotThrow(() => checkParityBigIntArray("seq", a, b));
});

test("checkParityBigIntArray fails on length mismatch", () => {
  const a = new BigInt64Array([1n, 2n]);
  const b = new BigInt64Array([1n, 2n, 3n]);
  assert.throws(() => checkParityBigIntArray("seq", a, b));
});

test("checkParityBigIntArray fails on element mismatch", () => {
  const a = new BigInt64Array([1n, 2n, 3n]);
  const b = new BigInt64Array([1n, 99n, 3n]);
  assert.throws(() => checkParityBigIntArray("seq", a, b), /\[1\]/);
});
