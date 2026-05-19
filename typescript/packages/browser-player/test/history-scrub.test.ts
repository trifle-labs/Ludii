import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createTicTacToeSession } from "../src/index.js";

describe("Move-history scrubbing via truncate()", () => {
  it("each played move appears as a trial entry with a stable index", () => {
    let session = createTicTacToeSession();
    const sites = [4, 0, 8];
    for (const site of sites) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move);
      session = session.apply(move.id);
    }
    assert.equal(session.trial.entries.length, 3);
    for (let i = 0; i < session.trial.entries.length; i += 1) {
      assert.equal(session.trial.entries[i]?.index, i);
      assert.deepEqual(session.trial.entries[i]?.move.siteIndices, [sites[i]]);
    }
  });

  it("truncate produces the state right after that move was played", () => {
    let session = createTicTacToeSession();
    const sites = [4, 0, 8, 1];
    for (const site of sites) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move);
      session = session.apply(move.id);
    }
    const afterMove1 = session.truncate(1);
    assert.equal(afterMove1.state.cellAt(4).owner, 1);
    assert.equal(afterMove1.state.cellAt(0).owner, 0);
    assert.equal(afterMove1.mover, 2);
  });

  it("truncate(0) yields the empty initial state without mutating the live session", () => {
    let session = createTicTacToeSession();
    for (const site of [0, 1, 2]) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move);
      session = session.apply(move.id);
    }
    const start = session.truncate(0);
    for (let i = 0; i < start.state.siteCount; i += 1) {
      assert.equal(start.state.cellAt(i).owner, 0);
    }
    // Live session retained all three moves.
    assert.equal(session.trial.entries.length, 3);
  });
});
