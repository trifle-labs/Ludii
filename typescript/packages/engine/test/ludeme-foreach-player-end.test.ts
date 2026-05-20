import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 1x4 row with one piece per player (P1 at site 0, P2 at site 3). The only
// move removes any occupied site. The end clause iterates the players and ends
// the game for the first one that owns no pieces: `(result Player Loss)` in a
// two-player game hands the win to the opponent. Removing P2's piece should
// therefore end the game with P1 as the winner.
const FOREACH_END = `
(game "ForEachPlayerEnd"
    (players 2)
    (equipment {
        (board (rectangle 1 4))
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {0}))
            (place "Disc2" (sites {3}))
        })
        (play (move Remove (sites Occupied)))
        (end (forEach Player if:(no Pieces Player) (result Player Loss)))
    )
)`;

describe("LudemeGame: (forEach Player …) end clause", () => {
  it("ends the game for the player left with no pieces", () => {
    const game = compileLudemeSource(FOREACH_END);
    const ctx = game.start();
    const capture = game.moves(ctx).find((m) => m.to() === 3);
    assert.ok(capture, "a move removing P2's piece exists");
    const next = game.apply(ctx, capture);
    assert.equal(next.over, true, "P2 having no pieces ends the game");
    assert.equal(next.winner, 1, "P1 wins when P2 is eliminated");
  });

  it("does not end the game while both players have pieces", () => {
    const game = compileLudemeSource(FOREACH_END);
    const ctx = game.start();
    assert.equal(ctx.over, false, "the opening position is not terminal");
  });
});

// Same board, but the end clause iterates only the non-mover players. After
// P1 removes P2's piece, the mover rotates to P2; the NonMover set is then
// {P1}, who still has a piece, so the clause does not fire — but checking the
// position right after P1's capture (mover still P1 in the eval frame) the
// non-mover P2 has no pieces and loses. This exercises the NonMover set.
const FOREACH_NONMOVER = `
(game "ForEachNonMoverEnd"
    (players 2)
    (equipment {
        (board (rectangle 1 4))
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {0}))
            (place "Disc2" (sites {3}))
        })
        (play (move Remove (sites Occupied)))
        (end (forEach NonMover if:(no Pieces Player) (result Player Loss)))
    )
)`;

describe("LudemeGame: (forEach NonMover …) end clause", () => {
  it("ends for a non-mover player left with no pieces", () => {
    const game = compileLudemeSource(FOREACH_NONMOVER);
    const ctx = game.start();
    const capture = game.moves(ctx).find((m) => m.to() === 3);
    assert.ok(capture, "a move removing P2's piece exists");
    const next = game.apply(ctx, capture);
    assert.equal(next.over, true, "non-mover P2 having no pieces ends it");
    assert.equal(next.winner, 1, "P1 wins");
  });
});
