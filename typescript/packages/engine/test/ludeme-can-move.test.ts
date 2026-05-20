import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(can Move <moves>)` is true when the given move generator produces at least
// one legal move in the current position. Here the play rule gates an Add move
// on whether a Remove move is currently possible: on a 1x3 board with P1 at 0
// and P2 at 2, "remove an occupied site" can fire (so the Add branch is taken,
// giving exactly one Add move onto the single empty site), whereas "remove an
// empty site" cannot (so the Pass branch is taken, giving one Pass move).
const gameSrc = (cond: string) => `
(game "CanMove"
    (players 2)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {0}))
            (place "Disc2" (sites {2}))
        })
        (play (if ${cond} (move Add (to (sites Empty))) (move Pass)))
        (end (if (= (count Pieces P1) 9) (result P1 Win)))
    )
)`;

describe("LudemeGame: (can Move …) bool", () => {
  it("is true when the inner move generator yields a move", () => {
    const game = compileLudemeSource(
      gameSrc("(can Move (move Remove (sites Occupied)))"),
    );
    const ctx = game.start();
    const moves = game.moves(ctx);
    // The Add branch fires: exactly one Add move onto the lone empty site.
    assert.equal(moves.length, 1);
    assert.equal(moves[0]?.to(), 1, "the Add move targets the empty site");
  });

  it("is false when the inner move generator yields nothing", () => {
    const game = compileLudemeSource(
      gameSrc("(can Move (move Remove (sites Empty)))"),
    );
    const ctx = game.start();
    const moves = game.moves(ctx);
    // No removable empty site, so the Pass branch fires instead.
    assert.equal(moves.length, 1, "falls through to the Pass branch");
  });
});
