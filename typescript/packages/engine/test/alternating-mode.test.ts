import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AlternatingMode } from "../src/index.js";

describe("AlternatingMode", () => {
  it("cycles 1→2→...→N→1", () => {
    const m = new AlternatingMode(3);
    assert.equal(m.next(1), 2);
    assert.equal(m.next(2), 3);
    assert.equal(m.next(3), 1);
  });

  it("treats 2-player play as a strict alternation", () => {
    const m = new AlternatingMode(2);
    assert.equal(m.next(1), 2);
    assert.equal(m.next(2), 1);
  });

  it("rejects invalid constructor or current-mover values", () => {
    assert.throws(() => new AlternatingMode(0));
    assert.throws(() => new AlternatingMode(1.5));
    const m = new AlternatingMode(2);
    assert.throws(() => m.next(0));
    assert.throws(() => m.next(3));
  });
});
