import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ActionCopy,
  ActionInsert,
  ActionMoveN,
  ActionMoveStacking,
  ActionMoveTopPiece,
  ActionPromote,
  ActionRemoveLevel,
  ActionRemoveTopPiece,
  ActionSelect,
  ActionSubStackMove,
  State,
} from "../src/index.js";

function emptyState(siteCount: number): State {
  return new State(1, new Array<number>(siteCount).fill(0), ["X", "O"]);
}

describe("move-family actions", () => {
  it("ActionCopy copies the from-cell owner to the to-cell", () => {
    const before = emptyState(9).withCell(0, 1);
    const after = new ActionCopy(0, 5).apply(before);
    assert.equal(after.cellAt(0).owner, 1);
    assert.equal(after.cellAt(5).owner, 1);
  });

  it("ActionPromote sets the target cell to the new what", () => {
    const after = new ActionPromote(3, 2).apply(emptyState(9));
    assert.equal(after.cellAt(3).owner, 2);
  });

  it("ActionSelect is a no-op marker", () => {
    const s = emptyState(9);
    assert.equal(new ActionSelect(0, 5).apply(s), s);
  });

  it("ActionInsert pushes onto the destination stack", () => {
    const after = new ActionInsert({ to: 4, what: 7, level: 0 }).apply(
      emptyState(9),
    );
    assert.equal(after.stackSize(4), 1);
    assert.equal(after.stackAt(4, 0), 7);
  });

  it("ActionMoveN moves multiple pieces from one stack to another", () => {
    let s = emptyState(9)
      .withStackPush(0, 1)
      .withStackPush(0, 2)
      .withStackPush(0, 3);
    s = new ActionMoveN({ from: 0, to: 5, count: 2 }).apply(s);
    assert.equal(s.stackSize(0), 1);
    assert.equal(s.stackSize(5), 2);
  });

  it("ActionMoveStacking pops then pushes onto destination stack", () => {
    const before = emptyState(9).withStackPush(0, 4);
    const after = new ActionMoveStacking(0, 5).apply(before);
    assert.equal(after.stackSize(0), 0);
    assert.equal(after.stackAt(5, 0), 4);
  });

  it("ActionMoveTopPiece moves only the top of a stack", () => {
    const before = emptyState(9).withStackPush(0, 1).withStackPush(0, 2);
    const after = new ActionMoveTopPiece(0, 5).apply(before);
    assert.equal(after.stackSize(0), 1);
    assert.equal(after.stackAt(5, 0), 2);
  });

  it("ActionRemoveTopPiece pops the top of a stack", () => {
    const before = emptyState(9).withStackPush(0, 1).withStackPush(0, 2);
    const after = new ActionRemoveTopPiece(0).apply(before);
    assert.equal(after.stackSize(0), 1);
  });

  it("ActionRemoveLevel pops one piece off the stack", () => {
    const before = emptyState(9).withStackPush(0, 1).withStackPush(0, 2);
    const after = new ActionRemoveLevel(0, 0).apply(before);
    assert.equal(after.stackSize(0), 1);
  });

  it("ActionSubStackMove moves a sub-stack preserving order", () => {
    let s = emptyState(9)
      .withStackPush(0, 1)
      .withStackPush(0, 2)
      .withStackPush(0, 3);
    s = new ActionSubStackMove(0, 1, 5).apply(s);
    assert.equal(s.stackSize(0), 1);
    assert.equal(s.stackSize(5), 2);
    assert.equal(s.stackAt(5, 0), 2);
    assert.equal(s.stackAt(5, 1), 3);
  });
});
