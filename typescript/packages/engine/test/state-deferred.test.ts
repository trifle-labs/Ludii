import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { State } from "../src/index.js";

describe("State.hash", () => {
  it("is deterministic for identical states", () => {
    const a = new State(1, [0, 1, 2], ["X", "O"]);
    const b = new State(1, [0, 1, 2], ["X", "O"]);
    assert.equal(a.hash(), b.hash());
  });

  it("changes when cells change", () => {
    const a = new State(1, [0, 1, 2], ["X", "O"]);
    const b = a.withCell(0, 2);
    assert.notEqual(a.hash(), b.hash());
  });

  it("changes when mover changes", () => {
    const a = new State(1, [0, 0], ["X", "O"]);
    const b = a.withMover(2);
    assert.notEqual(a.hash(), b.hash());
  });

  it("changes when scores change", () => {
    const a = new State(1, [0, 0], ["X", "O"]);
    const b = a.withScore(1, 4);
    assert.notEqual(a.hash(), b.hash());
  });

  it("returns a 32-bit unsigned integer", () => {
    const h = new State(1, [0, 1], ["X", "O"]).hash();
    assert.ok(Number.isInteger(h));
    assert.ok(h >= 0 && h <= 0xffffffff);
  });
});

describe("State hidden info", () => {
  it("defaults to no hidden cells", () => {
    const s = new State(1, [0, 0, 0], ["X", "O"]);
    assert.equal(s.isHidden(1, 0), false);
    assert.equal(s.isHidden(2, 1), false);
  });

  it("withHidden returns a new state with the flag set", () => {
    const s0 = new State(1, [0, 0, 0], ["X", "O"]);
    const s1 = s0.withHidden(1, 2, true);
    assert.equal(s0.isHidden(1, 2), false);
    assert.equal(s1.isHidden(1, 2), true);
    assert.equal(s1.isHidden(2, 2), false);
  });

  it("rejects out-of-range pid / siteIndex", () => {
    const s = new State(1, [0, 0], ["X", "O"]);
    assert.throws(() => s.withHidden(-1, 0, true));
    assert.throws(() => s.withHidden(99, 0, true));
    assert.throws(() => s.withHidden(1, -1, true));
    assert.throws(() => s.withHidden(1, 99, true));
  });
});

describe("State stacks", () => {
  it("non-stacking games show 1-element stacks mirroring cells", () => {
    const s = new State(1, [0, 1, 2], ["X", "O"]);
    assert.equal(s.stackSize(0), 0);
    assert.equal(s.stackSize(1), 1);
    assert.equal(s.stackAt(1, 0), 1);
    assert.equal(s.stackAt(2, 0), 2);
  });

  it("withStackPush layers pieces and keeps cell pointed at the top", () => {
    const s0 = new State(1, [0, 0], ["X", "O"]);
    const s1 = s0.withStackPush(0, 1).withStackPush(0, 2);
    assert.equal(s1.stackSize(0), 2);
    assert.equal(s1.stackAt(0, 0), 1);
    assert.equal(s1.stackAt(0, 1), 2);
    assert.equal(s1.cellAt(0).owner, 2);
  });

  it("withStackPop reveals the buried piece", () => {
    const s = new State(1, [0, 0], ["X", "O"])
      .withStackPush(0, 1)
      .withStackPush(0, 2);
    const popped = s.withStackPop(0);
    assert.equal(popped.stackSize(0), 1);
    assert.equal(popped.cellAt(0).owner, 1);
  });

  it("popping an empty stack clears the cell", () => {
    const s = new State(1, [1, 0], ["X", "O"]);
    const popped = s.withStackPop(0);
    assert.equal(popped.stackSize(0), 0);
    assert.equal(popped.cellAt(0).owner, 0);
  });

  it("withCell keeps stacks in sync (replaces top, preserves buried pieces)", () => {
    const s = new State(1, [0, 0], ["X", "O"])
      .withStackPush(0, 1)
      .withStackPush(0, 2);
    const replaced = s.withCell(0, 3);
    assert.equal(replaced.stackSize(0), 2);
    assert.equal(replaced.stackAt(0, 0), 1);
    assert.equal(replaced.stackAt(0, 1), 3);
  });

  it("withCell to 0 clears the stack", () => {
    const s = new State(1, [0, 0], ["X", "O"]).withStackPush(0, 1);
    const cleared = s.withCell(0, 0);
    assert.equal(cleared.stackSize(0), 0);
  });

  it("containerState.count reads stack size", () => {
    const s = new State(1, [0, 0], ["X", "O"])
      .withStackPush(0, 1)
      .withStackPush(0, 2);
    const cs = s.containerState();
    assert.equal(cs.count(0), 2);
    assert.equal(cs.isEmpty(0), false);
    assert.equal(cs.isEmpty(1), true);
  });
});
