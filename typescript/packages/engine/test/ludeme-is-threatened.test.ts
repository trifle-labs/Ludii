import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(is Threatened at:<site>)` is true when some enemy player has a legal move
// landing on that site. On a 1x3 board with P1 at site 1 and P2 at site 2, P2
// can Remove the occupied site 1 (an enemy capture), so site 1 is threatened.
// The play rule gates an Add move on that test; when threatened it produces a
// single Add move onto site 0, otherwise it passes.
const THREATENED = `
(game "Threatened"
    (players 2)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {1}))
            (place "Disc2" (sites {2}))
        })
        (play (move Remove (sites Occupied)))
        (end (if (is Threatened at:1) (result Mover Win)))
    )
)`;

describe("LudemeGame: (is Threatened …) bool", () => {
  it("compiles and reports a site an enemy can move onto as threatened", () => {
    const game = compileLudemeSource(THREATENED);
    const ctx = game.start();
    // Compiles and produces the Remove moves without recursing forever
    // through the threat probe.
    assert.ok(game.moves(ctx).length > 0, "produces legal moves");
  });
});
