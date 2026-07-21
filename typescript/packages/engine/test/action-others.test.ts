import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ActionForfeit, ActionPass, Move, State } from "../src/index.js";

function emptyState(siteCount: number): State {
  return new State(1, new Array<number>(siteCount).fill(0), ["X", "O"]);
}

describe("ActionPass", () => {
  it("apply is a no-op", () => {
    const before = emptyState(9).withCell(2, 1);
    const after = new ActionPass().apply(before);
    for (let i = 0; i < 9; i += 1) {
      assert.equal(after.cellAt(i).owner, before.cellAt(i).owner);
    }
  });

  it("reports isPass and Pass action type", () => {
    const a = new ActionPass();
    assert.equal(a.actionType(), "Pass");
    assert.equal(a.isPass(), true);
    assert.equal(a.isAlwaysGUILegal(), true);
  });

  it("a Move built on ActionPass is reported as a pass", () => {
    const move = new Move({
      id: "pass",
      label: "pass",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionPass()],
    });
    assert.equal(move.isPass(), true);
    assert.equal(move.actionType(), "Pass");
  });
});

describe("ActionForfeit", () => {
  it("apply is a no-op", () => {
    const before = emptyState(9).withCell(2, 1);
    const after = new ActionForfeit({ player: 1 }).apply(before);
    for (let i = 0; i < 9; i += 1) {
      assert.equal(after.cellAt(i).owner, before.cellAt(i).owner);
    }
  });

  it("reports isForfeit, who, and Forfeit action type", () => {
    const a = new ActionForfeit({ player: 2 });
    assert.equal(a.actionType(), "Forfeit");
    assert.equal(a.isForfeit(), true);
    assert.equal(a.who(), 2);
  });

  it("rejects non-positive player indices", () => {
    assert.throws(() => new ActionForfeit({ player: 0 }));
    assert.throws(() => new ActionForfeit({ player: -1 }));
  });

  it("a Move built on ActionForfeit is reported as a forfeit", () => {
    const move = new Move({
      id: "ff",
      label: "ff",
      siteIndices: [0],
      mover: 1,
      placedOwner: 1,
      actions: [new ActionForfeit({ player: 1 })],
    });
    assert.equal(move.isForfeit(), true);
    assert.equal(move.actionType(), "Forfeit");
  });
});
