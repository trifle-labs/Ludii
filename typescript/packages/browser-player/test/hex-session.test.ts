import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createHexSession } from "../src/index.js";

describe("createHexSession", () => {
  it("exposes the contract on a default Hex board", () => {
    const session = createHexSession();
    assert.equal(session.game.id, "hex-7");
    assert.equal(session.game.width, 7);
    assert.equal(session.game.height, 7);
    assert.equal(session.state.siteCount, 49);
    assert.equal(session.mover, 1);
    assert.equal(session.over, false);
  });

  it("plays a winning chain and reports the winner via the contract", () => {
    let session = createHexSession(3);
    const sites = [
      0, // P1 (0,0)
      2, // P2 (2,0)
      3, // P1 (0,1)
      5, // P2 (2,1)
      6, // P1 (0,2) — completes top↔bottom
    ];
    for (const site of sites) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move, `no legal move at site ${site}`);
      session = session.apply(move.id);
    }
    assert.equal(session.over, true);
    assert.equal(session.winner, 1);
  });

  it("truncate replays the engine moves to the requested point", () => {
    let session = createHexSession(3);
    for (const site of [4, 0, 3]) {
      const move = session.legalMovesAtSite(site)[0];
      assert.ok(move);
      session = session.apply(move.id);
    }
    const after1 = session.truncate(1);
    assert.equal(after1.state.cellAt(4).owner, 1);
    assert.equal(after1.state.cellAt(0).owner, 0);
    assert.equal(after1.mover, 2);
  });
});
