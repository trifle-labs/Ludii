import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ActionAdd, ActionMove, Move, State } from "../src/index.js";

function emptyState(siteCount: number): State {
  return new State(1, new Array<number>(siteCount).fill(0), ["X", "O"]);
}

describe("Move.equals", () => {
  it("treats moves with the same data as equal regardless of id/label", () => {
    const a = new Move({
      id: "a",
      label: "first",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    const b = new Move({
      id: "b",
      label: "second",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    assert.equal(a.equals(b), true);
  });

  it("differs when sites differ", () => {
    const a = new Move({
      id: "x",
      label: "x",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    const b = new Move({
      id: "x",
      label: "x",
      siteIndices: [1],
      mover: 1,
      placedOwner: 1,
    });
    assert.equal(a.equals(b), false);
  });

  it("differs when action sequences differ", () => {
    const a = new Move({
      id: "x",
      label: "x",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 0, what: 1 })],
    });
    const b = new Move({
      id: "x",
      label: "x",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 0, what: 2 })],
    });
    assert.equal(a.equals(b), false);
  });
});

describe("Move.hash", () => {
  it("matches Move.equals: equal moves hash equal", () => {
    const a = new Move({
      id: "a",
      label: "first",
      siteIndices: [2],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 2, what: 1 })],
    });
    const b = new Move({
      id: "b",
      label: "second",
      siteIndices: [2],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 2, what: 1 })],
    });
    assert.equal(a.hash(), b.hash());
  });

  it("returns a 32-bit unsigned integer", () => {
    const m = new Move({
      id: "m",
      label: "m",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    const h = m.hash();
    assert.ok(Number.isInteger(h));
    assert.ok(h >= 0 && h <= 0xffffffff);
  });
});

describe("Move.then chaining", () => {
  it("applies subsequent moves after the main move's actions", () => {
    const sub = new Move({
      id: "sub",
      label: "sub",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionMove({ from: 0, to: 4 })],
    });
    const main = new Move({
      id: "main",
      label: "main",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 0, what: 1 })],
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: [sub],
    });
    const after = main.applyTo(emptyState(9));
    assert.equal(after.cellAt(0).owner, 0);
    assert.equal(after.cellAt(4).owner, 1);
  });

  it("equals compares then-chains", () => {
    const t = new Move({
      id: "t",
      label: "t",
      siteIndices: [1],
      mover: 1,
      placedOwner: 1,
    });
    const a = new Move({
      id: "a",
      label: "a",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: [t],
    });
    const b = new Move({
      id: "a",
      label: "a",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: [t],
    });
    const c = new Move({
      id: "a",
      label: "a",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    assert.equal(a.equals(b), true);
    assert.equal(a.equals(c), false);
  });
});

describe("Move.concepts", () => {
  it("derives concepts from the action sequence", () => {
    const move = new Move({
      id: "x",
      label: "x",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [
        new ActionAdd({ to: 0, what: 1 }),
        new ActionMove({ from: 0, to: 4 }),
      ],
    });
    const c = move.concepts();
    assert.equal(c.has("Add"), true);
    assert.equal(c.has("Move"), true);
  });

  it("legacy moves with no actions report an empty concept set", () => {
    const move = new Move({
      id: "p",
      label: "p",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
    });
    assert.equal(move.concepts().size, 0);
  });

  it("unions concepts from then-chained moves", () => {
    const sub = new Move({
      id: "sub",
      label: "sub",
      siteIndices: [1],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionMove({ from: 0, to: 1 })],
    });
    const main = new Move({
      id: "main",
      label: "main",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 0, what: 1 })],
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: [sub],
    });
    const c = main.concepts();
    assert.equal(c.has("Add"), true);
    assert.equal(c.has("Move"), true);
  });
});

describe("Action.previousHidden snapshot", () => {
  it("defaults to undefined", () => {
    const a = new ActionAdd({ to: 0, what: 1 });
    assert.equal(a.previousHidden(), undefined);
  });

  it("setPreviousHidden persists the snapshot", () => {
    const a = new ActionAdd({ to: 0, what: 1 });
    const snap = { hidden: [false, true, false] };
    a.setPreviousHidden(snap);
    assert.equal(a.previousHidden(), snap);
  });
});
