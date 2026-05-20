import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 1x5 row with one P1 piece pre-placed. Each Add grows the mover's piece
// count; the game ends as soon as P1 owns two pieces. This drives
// (count Pieces Mover) through the cell scan.
const PIECES = `
(game "CountPieces"
    (players 1)
    (equipment {
        (board (rectangle 1 5))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {0})))
        (play (move Add (to (sites Empty))))
        (end (if (>= (count Pieces Mover) 2) (result Mover Win)))
    )
)`;

// A 1x5 row with two P1 singletons at sites 0 and 2 (the gap at site 1 keeps
// them apart). Adding at site 1 fuses 0-1-2 into a single connected group, so
// (count Groups) drops from 2 to 1 and the game ends; adding at the far site 4
// leaves three groups and play continues. This drives the flood-fill in
// groupComponents via (count Groups).
const GROUPS = `
(game "CountGroups"
    (players 1)
    (equipment {
        (board (rectangle 1 5))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {0 2})))
        (play (move Add (to (sites Empty))))
        (end (if (= (count Groups) 1) (result Mover Win)))
    )
)`;

describe("LudemeGame: (count Pieces …)", () => {
  it("wins once the mover owns two pieces", () => {
    const game = compileLudemeSource(PIECES);
    const ctx = game.start();
    const move = game.moves(ctx).find((m) => m.to() === 3);
    assert.ok(move, "a move onto an empty site exists");
    const next = game.apply(ctx, move);
    assert.equal(next.over, true, "second piece ends the game");
    assert.equal(next.winner, 1, "P1 wins");
  });
});

describe("LudemeGame: (count Groups) connected components", () => {
  it("wins when a move fuses two groups into one", () => {
    const game = compileLudemeSource(GROUPS);
    const ctx = game.start();
    const fuse = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(fuse, "a move onto the connecting site exists");
    const next = game.apply(ctx, fuse);
    assert.equal(next.over, true, "one group ends the game");
    assert.equal(next.winner, 1, "P1 wins");
  });

  it("continues when a move leaves more than one group", () => {
    const game = compileLudemeSource(GROUPS);
    const ctx = game.start();
    const apart = game.moves(ctx).find((m) => m.to() === 4);
    assert.ok(apart, "a move onto the far site exists");
    const next = game.apply(ctx, apart);
    assert.equal(next.over, false, "three groups do not end the game");
  });
});
