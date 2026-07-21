import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSessionFromLud } from "../src/index.js";

const TIC_TAC_TOE = `(game "Tic-Tac-Toe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "X" P1)
        (piece "O" P2)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))
    )
)`;

describe("createSessionFromLud", () => {
  it("produces a playable session from a tic-tac-toe .lud string", () => {
    const session = createSessionFromLud(TIC_TAC_TOE);
    assert.equal(session.game.numPlayers, 2);
    assert.equal(session.state.siteCount, 9);
    assert.equal(session.legalMoves().length, 9);
  });

  it("renders component labels from the .lud piece names", () => {
    const session = createSessionFromLud(TIC_TAC_TOE);
    const first = session.legalMovesAtSite(0)[0];
    assert.ok(first);
    const after = session.apply(first.id);
    // @java Game.componentLabels — `${component.name()}${owner}`
    assert.equal(after.state.cellAt(0).componentLabel, "X1");
  });

  it("propagates compile errors when the source is malformed", () => {
    assert.throws(() => createSessionFromLud("(game)"));
  });
});
