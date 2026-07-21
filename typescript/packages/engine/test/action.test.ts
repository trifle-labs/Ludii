import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ActionAdd,
  ActionMove,
  ActionRemove,
  isActionType,
  isSiteType,
  Move,
  SITE_TYPES,
  State,
} from "../src/index.js";

function emptyState(siteCount: number): State {
  return new State(1, new Array<number>(siteCount).fill(0), ["X", "O"]);
}

describe("SITE_TYPES", () => {
  it("matches the Java enum declaration order", () => {
    assert.deepEqual([...SITE_TYPES], ["Vertex", "Edge", "Cell"]);
  });

  it("isSiteType narrows correctly", () => {
    assert.equal(isSiteType("Cell"), true);
    assert.equal(isSiteType("cell"), false);
    assert.equal(isSiteType("Hex"), false);
  });
});

describe("ACTION_TYPES", () => {
  it("includes the action categories the MVE engine touches", () => {
    for (const name of [
      "Add",
      "Pass",
      "Remove",
      "Move",
      "MoveN",
      "Swap",
      "Vote",
      "Forfeit",
    ]) {
      assert.ok(isActionType(name), `expected ${name} to be an ActionType`);
    }
  });

  it("isActionType rejects unknown names", () => {
    assert.equal(isActionType("Nonsense"), false);
  });
});

describe("ActionAdd", () => {
  it("places a piece at the target site", () => {
    const a = new ActionAdd({ to: 4, what: 1 });
    const result = a.apply(emptyState(9));
    assert.equal(result.cellAt(4).owner, 1);
  });

  it("reports its Java-shape data members", () => {
    const a = new ActionAdd({ to: 4, what: 1, count: 2 });
    assert.equal(a.actionType(), "Add");
    assert.equal(a.to(), 4);
    assert.equal(a.what(), 1);
    assert.equal(a.who(), 1);
    assert.equal(a.count(), 2);
    assert.equal(a.fromType(), "Cell");
    assert.equal(a.toType(), "Cell");
    assert.equal(a.isDecision(), false);
    a.withDecision(true);
    assert.equal(a.isDecision(), true);
  });

  it("applies as a no-op for OFF site / empty what", () => {
    // @java ActionAdd.java — Java actions never validate in the constructor;
    // an OFF site or what<=0 simply applies as a no-op (Loop Xiangqi probes
    // piece ids during generation before any capture exists).
    const s = emptyState(9);
    assert.equal(new ActionAdd({ to: -1, what: 1 }).apply(s), s);
    assert.equal(new ActionAdd({ to: 0, what: 0 }).apply(s), s);
  });
});

describe("ActionMove", () => {
  it("moves a piece from one site to another", () => {
    const s = emptyState(9).withCell(0, 1);
    const moved = new ActionMove({ from: 0, to: 4 }).apply(s);
    assert.equal(moved.cellAt(0).owner, 0);
    assert.equal(moved.cellAt(4).owner, 1);
  });

  it("is a no-op if the source is empty (Java parity)", () => {
    // Java ActionMoveTopPiece.apply: "If the origin is empty we do not apply
    // this action" → returns the state unchanged rather than throwing.
    const s = emptyState(9);
    const after = new ActionMove({ from: 0, to: 4 }).apply(s);
    assert.equal(after.cellAt(0).owner, 0);
    assert.equal(after.cellAt(4).owner, 0);
  });

  it("reports the action type and from/to", () => {
    const a = new ActionMove({ from: 1, to: 2 });
    assert.equal(a.actionType(), "Move");
    assert.equal(a.from(), 1);
    assert.equal(a.to(), 2);
  });
});

describe("ActionRemove", () => {
  it("clears the target site", () => {
    const s = emptyState(9).withCell(2, 1);
    const after = new ActionRemove({ to: 2 }).apply(s);
    assert.equal(after.cellAt(2).owner, 0);
  });

  it("reports the action type and to", () => {
    const a = new ActionRemove({ to: 5 });
    assert.equal(a.actionType(), "Remove");
    assert.equal(a.to(), 5);
  });
});

describe("Move with action sequence", () => {
  it("an Action-sequenced Move applies identically to the legacy shortcut", () => {
    const legacy = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
    });
    const actionised = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 4, what: 1 })],
    });
    const start = emptyState(9);
    const a = legacy.applyTo(start);
    const b = actionised.applyTo(start);
    assert.deepEqual(
      Array.from({ length: 9 }, (_, i) => a.cellAt(i).owner),
      Array.from({ length: 9 }, (_, i) => b.cellAt(i).owner),
    );
  });

  it("folds multiple actions in order", () => {
    const move = new Move({
      id: "shift0to4",
      label: "shift 0→4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
      actions: [
        new ActionAdd({ to: 0, what: 1 }),
        new ActionMove({ from: 0, to: 4 }),
      ],
    });
    const after = move.applyTo(emptyState(9));
    assert.equal(after.cellAt(0).owner, 0);
    assert.equal(after.cellAt(4).owner, 1);
  });

  it("exposes the decision action as the first action", () => {
    const decision = new ActionAdd({ to: 4, what: 1 });
    const move = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
      actions: [decision],
    });
    assert.equal(move.decisionAction(), decision);
  });

  it("legacy moves report no decision action", () => {
    const move = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
    });
    assert.equal(move.decisionAction(), undefined);
  });

  it("delegates Java-shape accessors to the decision action", () => {
    const move = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionAdd({ to: 4, what: 1, count: 3 })],
    });
    assert.equal(move.actionType(), "Add");
    assert.equal(move.to(), 4);
    assert.equal(move.what(), 1);
    assert.equal(move.who(), 1);
    assert.equal(move.count(), 3);
    assert.equal(move.fromType(), "Cell");
    assert.equal(move.toType(), "Cell");
    assert.equal(move.isPass(), false);
  });

  it("legacy moves fall back to MVE defaults for delegation accessors", () => {
    const move = new Move({
      id: "p4",
      label: "place 4",
      siteIndices: [4],
      mover: 2,
      placedOwner: 2,
    });
    assert.equal(move.actionType(), undefined);
    assert.equal(move.to(), 4);
    assert.equal(move.what(), 2);
    assert.equal(move.who(), 2);
    assert.equal(move.count(), 1);
  });
});
