import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(move Promote <site>)` produces a Move that rewrites the piece at <site>.
// The State model has no separate piece-type layer (a cell stores only its
// owner), so Promote is owner-preserving here: the move is generated at each
// occupied site and applying it leaves ownership unchanged. This test pins
// that compile-and-apply behavior down so the move form keeps working.
const PROMOTE = `
(game "Promote"
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
        (play (forEach Site (sites Occupied) (move Promote (site))))
        (end (if (= (count Pieces P1) 9) (result P1 Win)))
    )
)`;

describe("LudemeGame: (move Promote …)", () => {
  it("generates a promote move at each occupied site", () => {
    const game = compileLudemeSource(PROMOTE);
    const ctx = game.start();
    const moves = game.moves(ctx);
    const tos = moves.map((m) => m.to()).sort((a, b) => a - b);
    assert.deepEqual(tos, [0, 2], "one promote move per occupied site");
  });

  it("preserves ownership when applied", () => {
    const game = compileLudemeSource(PROMOTE);
    const ctx = game.start();
    const move = game.moves(ctx).find((m) => m.to() === 0);
    assert.ok(move, "a promote move at site 0 exists");
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[0], 1, "site 0 is still owned by P1");
  });
});
