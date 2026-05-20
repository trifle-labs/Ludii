import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 1x3 row with a P1 piece pre-placed at site 0. Adding a piece at the
// adjacent site 1 grows P1's connected group to size 2 and wins; adding at the
// far site 2 leaves two singleton groups and the game continues. This drives
// (size Group at:(last To)) through the flood-fill + neighbour helpers.
const GROUP = `
(game "GroupSize"
    (players 1)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {0})))
        (play (move Add (to (sites Empty))))
        (end (if (>= (size Group at:(last To)) 2) (result Mover Win)))
    )
)`;

describe("LudemeGame: (size Group …) connected-component size", () => {
  it("wins when a move connects two same-owner cells", () => {
    const game = compileLudemeSource(GROUP);
    const ctx = game.start();
    const connect = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(connect, "a move onto the adjacent site exists");
    const next = game.apply(ctx, connect);
    assert.equal(next.over, true, "group of 2 ends the game");
    assert.equal(next.winner, 1, "P1 wins");
  });

  it("continues when a move leaves a singleton group", () => {
    const game = compileLudemeSource(GROUP);
    const ctx = game.start();
    const apart = game.moves(ctx).find((m) => m.to() === 2);
    assert.ok(apart, "a move onto the far site exists");
    const next = game.apply(ctx, apart);
    assert.equal(next.over, false, "two singleton groups do not end the game");
  });
});
