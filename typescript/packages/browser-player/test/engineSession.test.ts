import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTicTacToeSession } from "../src/index.js";

describe("EngineSession (tic-tac-toe adapter)", () => {
  it("exposes the engine via the BrowserGameSession contract", () => {
    const session = createTicTacToeSession();
    assert.equal(session.game.id, "tic-tac-toe");
    assert.equal(session.game.numPlayers, 2);
    assert.equal(session.game.width, 3);
    assert.equal(session.game.height, 3);
    assert.equal(session.state.siteCount, 9);
    assert.equal(session.mover, 1);
    assert.equal(session.over, false);
  });

  it("returns 9 legal moves on a fresh board", () => {
    const session = createTicTacToeSession();
    assert.equal(session.legalMoves().length, 9);
  });

  it("filters legal moves to a single site via legalMovesAtSite", () => {
    const session = createTicTacToeSession();
    const center = session.legalMovesAtSite(4);
    assert.equal(center.length, 1);
    assert.deepEqual(center[0]?.siteIndices, [4]);
  });

  it("apply() returns a new immutable session", () => {
    const session = createTicTacToeSession();
    const move = session.legalMovesAtSite(0)[0];
    assert.ok(move, "legal move at site 0 must exist");
    const next = session.apply(move.id);
    assert.notStrictEqual(next, session);
    assert.equal(session.mover, 1);
    assert.equal(next.mover, 2);
    assert.equal(next.state.cellAt(0).owner, 1);
    assert.equal(session.state.cellAt(0).owner, 0);
  });

  it("plays a full tic-tac-toe sequence to X-win", () => {
    let session = createTicTacToeSession();
    for (const site of [0, 3, 1, 4, 2]) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move, `legal move at site ${site} expected`);
      session = session.apply(move.id);
    }
    assert.equal(session.over, true);
    assert.equal(session.winner, 1);
    assert.deepEqual(session.legalMoves(), []);
  });

  it("reset returns a fresh empty session", () => {
    let session = createTicTacToeSession();
    const first = session.legalMovesAtSite(0)[0];
    assert.ok(first);
    session = session.apply(first.id);
    const fresh = session.reset();
    assert.equal(fresh.state.cellAt(0).owner, 0);
    assert.equal(fresh.mover, 1);
    assert.equal(fresh.trial.entries.length, 0);
  });

  it("truncate scrubs the trial without affecting the original", () => {
    let session = createTicTacToeSession();
    for (const site of [0, 3, 1]) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move);
      session = session.apply(move.id);
    }
    assert.equal(session.trial.entries.length, 3);
    const earlier = session.truncate(1);
    assert.equal(earlier.trial.entries.length, 1);
    assert.equal(earlier.state.cellAt(0).owner, 1);
    assert.equal(earlier.state.cellAt(3).owner, 0);
    // Original is unchanged
    assert.equal(session.trial.entries.length, 3);
  });

  it("rejects unknown move ids", () => {
    const session = createTicTacToeSession();
    assert.throws(() => session.apply("does-not-exist"));
  });

  it("truncate validates the move count", () => {
    const session = createTicTacToeSession();
    assert.throws(() => session.truncate(-1));
    assert.throws(() => session.truncate(99));
  });
});
