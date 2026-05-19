import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Move, Trial } from "../src/index.js";

function place(id: string, site: number, mover: number): Move {
  return new Move({
    id,
    label: id,
    siteIndices: [site],
    mover,
    placedOwner: mover,
  });
}

describe("Trial", () => {
  it("starts empty with no moves and no winner", () => {
    const t = new Trial([], false, -1);
    assert.equal(t.numMoves, 0);
    assert.equal(t.over, false);
    assert.equal(t.winner, -1);
    assert.equal(t.lastMove(), undefined);
    assert.deepEqual(t.status(), { over: false, winner: -1 });
  });

  it("withMove appends a move and returns a new Trial", () => {
    const t0 = new Trial([], false, -1);
    const t1 = t0.withMove(place("m0", 0, 1), false, -1);
    assert.equal(t0.numMoves, 0);
    assert.equal(t1.numMoves, 1);
    assert.equal(t1.lastMove()?.id, "m0");
  });

  it("lastMove(pid) returns the most recent move made by that player", () => {
    const t = new Trial(
      [place("a", 0, 1), place("b", 1, 2), place("c", 2, 1), place("d", 3, 2)],
      false,
      -1,
    );
    assert.equal(t.lastMove()?.id, "d");
    assert.equal(t.lastMove(1)?.id, "c");
    assert.equal(t.lastMove(2)?.id, "d");
    assert.equal(t.lastMove(3), undefined);
  });

  it("getMove returns moves by index, undefined out of range", () => {
    const t = new Trial([place("a", 0, 1), place("b", 1, 2)], false, -1);
    assert.equal(t.getMove(0)?.id, "a");
    assert.equal(t.getMove(1)?.id, "b");
    assert.equal(t.getMove(2), undefined);
    assert.equal(t.getMove(-1), undefined);
  });

  it("generateRealMovesList skips the initial-placement prefix", () => {
    const t = new Trial(
      [place("setup", 0, 1), place("a", 1, 1), place("b", 2, 2)],
      false,
      -1,
      1,
    );
    assert.equal(t.generateCompleteMovesList().length, 3);
    const real = t.generateRealMovesList();
    assert.equal(real.length, 2);
    assert.equal(real[0]?.id, "a");
  });

  it("reverseMoveIterator walks moves last-to-first", () => {
    const t = new Trial(
      [place("a", 0, 1), place("b", 1, 2), place("c", 2, 1)],
      false,
      -1,
    );
    const ids = [...t.reverseMoveIterator()].map((m) => m.id);
    assert.deepEqual(ids, ["c", "b", "a"]);
  });

  it("rejects an over=false trial that claims a winner", () => {
    assert.throws(() => new Trial([], false, 1));
  });

  it("rejects a negative numInitialPlacementMoves", () => {
    assert.throws(() => new Trial([], false, -1, -2));
  });
});
