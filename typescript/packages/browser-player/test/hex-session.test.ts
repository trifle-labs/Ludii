import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createHexSession } from "../src/index.js";

describe("createHexSession", () => {
  it("exposes the contract on a default Hex board", () => {
    const session = createHexSession();
    // The faithful Game derives id from the .lud game name (@java Game.name())
    assert.equal(session.game.id, "Hex");
    // (hex Diamond 7) — a 7×7 rhombus of hexagonal cells (@java HexShape.Diamond)
    assert.equal(session.state.siteCount, 49);
    assert.equal(session.mover, 1);
    assert.equal(session.over, false);
    assert.equal(session.legalMoves().length, 49);
  });

  it("plays an alternating sequence through the session contract", () => {
    // Engine-vs-Java CORRECTNESS (incl. the connection win) is proven by the
    // recorded-trial parity harness (Hex 2/2 OUTCOME_OK); this test verifies
    // the EMBEDDING: alternation, immutability, trial growth, ownership.
    let session = createHexSession(5);
    const before = session;
    for (let i = 0; i < 10 && !session.over; i++) {
      const moves = session.legalMoves();
      assert.ok(moves.length > 0);
      const pick = moves[0]!;
      const expectMover = session.mover;
      session = session.apply(pick.id);
      assert.notEqual(session, before);
      assert.equal(session.trial.entries.length, i + 1);
      assert.equal(session.trial.entries[i]!.move.mover, expectMover);
    }
    assert.equal(before.trial.entries.length, 0);
    const owned = Array.from({ length: session.state.siteCount }, (_, i) => session.state.cellAt(i).owner)
      .filter((o) => o > 0).length;
    assert.equal(owned, 10);
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
