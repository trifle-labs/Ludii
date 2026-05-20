import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// Option substitution leaves arithmetic behind in board dimensions, e.g.
// `(tri (- 5 1))`. The dimension must be evaluated statically (to 4) rather
// than collapsing to NaN and throwing "Invalid array length" when the mask is
// allocated.
const ARITH_TRI = `
(game "ArithTri"
    (players 1)
    (equipment {
        (board (tri (- 5 1)))
        (piece "Disc" P1)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Full) (result Mover Win)))
    )
)`;

// An irregular polygon outline `(tri {4 6 4 7 4})` has no single side length;
// the builder must not crash on the curly-list dimension.
const POLY_TRI = `
(game "PolyTri"
    (players 1)
    (equipment {
        (board (tri {4 6 4 7 4}))
        (piece "Disc" P1)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Full) (result Mover Win)))
    )
)`;

describe("LudemeGame: arithmetic / irregular board dimensions", () => {
  it("evaluates an arithmetic board dimension instead of crashing", () => {
    const game = compileLudemeSource(ARITH_TRI);
    const ctx = game.start();
    // A side-4 triangle has 4*4/2 = 8 on-board cells, all empty at the start.
    assert.ok(game.moves(ctx).length > 0, "produces legal Add moves");
  });

  it("compiles an irregular-polygon board without throwing", () => {
    const game = compileLudemeSource(POLY_TRI);
    const ctx = game.start();
    assert.ok(game.moves(ctx).length > 0, "produces legal Add moves");
  });
});
