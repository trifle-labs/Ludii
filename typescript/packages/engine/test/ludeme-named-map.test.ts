import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 1x6 row with a single P1 piece at site 0. The equipment declares a named
// map "Throw" that translates a key into a destination column. The Add move
// uses (mapEntry "Throw" 2) — which the map sends to site 4 — so exactly one
// move lands the new piece there. This exercises named-map lookup through the
// (mapEntry "Name" <key>) form.
const NAMED_MAP = `
(game "NamedMap"
    (players 1)
    (equipment {
        (board (rectangle 1 6))
        (piece "Disc" P1)
        (map "Throw" {(pair 0 5) (pair 1 3) (pair 2 4) (pair 3 3) (pair 4 1)})
    })
    (rules
        (start (place "Disc1" (sites {0})))
        (play (move Add (to (mapEntry "Throw" 2))))
        (end (if (>= (count Pieces Mover) 2) (result Mover Win)))
    )
)`;

describe("LudemeGame: (mapEntry \"Name\" <key>) named map", () => {
  it("resolves a key through a named (map …) declaration", () => {
    const game = compileLudemeSource(NAMED_MAP);
    const ctx = game.start();
    const moves = game.moves(ctx);
    const tos = new Set(moves.map((m) => m.to()));
    assert.deepEqual([...tos], [4], "key 2 maps to site 4");
    const next = game.apply(ctx, moves[0]!);
    assert.equal(next.over, true, "second piece ends the game");
    assert.equal(next.winner, 1, "P1 wins");
  });
});
