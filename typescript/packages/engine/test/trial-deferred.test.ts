import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Move, State, Trial } from "../src/index.js";

function place(id: string, site: number, mover: number): Move {
  return new Move({
    id,
    label: id,
    siteIndices: [site],
    mover,
    placedOwner: mover,
  });
}

describe("Trial deferred surfaces", () => {
  it("starts with empty previousStates / ranking arrays", () => {
    const t = new Trial([], false, -1);
    assert.deepEqual([...t.previousStates], []);
    assert.deepEqual([...t.previousStatesWithinATurn], []);
    assert.deepEqual([...t.ranking], []);
  });

  it("saveState appends the state hash to both history arrays", () => {
    const s0 = new State(1, [0, 0, 0], ["X", "O"]);
    const s1 = s0.withCell(0, 1);
    const t = new Trial([], false, -1).saveState(s0).saveState(s1);
    assert.deepEqual([...t.previousStates], [s0.hash(), s1.hash()]);
    assert.deepEqual([...t.previousStatesWithinATurn], [s0.hash(), s1.hash()]);
  });

  it("newTurn clears within-turn history but keeps the full log", () => {
    const s0 = new State(1, [0, 0], ["X", "O"]);
    const s1 = s0.withCell(0, 1);
    const t = new Trial([], false, -1).saveState(s0).saveState(s1).newTurn();
    assert.equal(t.previousStates.length, 2);
    assert.equal(t.previousStatesWithinATurn.length, 0);
  });

  it("withRanking returns a new trial with the ranking populated", () => {
    const t = new Trial([], true, 1).withRanking([1, 2]);
    assert.deepEqual([...t.ranking], [1, 2]);
  });

  it("options-shape constructor preserves arrays through withMove", () => {
    const s = new State(1, [0, 0], ["X", "O"]);
    const t0 = new Trial([], false, -1, {
      numInitialPlacementMoves: 0,
      previousStates: [s.hash()],
      ranking: [1, 2],
    });
    const t1 = t0.withMove(place("m", 0, 1), false, -1);
    assert.deepEqual([...t1.previousStates], [s.hash()]);
    assert.deepEqual([...t1.ranking], [1, 2]);
  });

  it("positional numInitialPlacementMoves still works", () => {
    const t = new Trial([], false, -1, 2);
    assert.equal(t.numInitialPlacementMoves, 2);
  });
});
