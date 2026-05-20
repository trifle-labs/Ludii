import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A minimal game that exercises the remembered-values subsystem end to end:
//  - the start rule seeds "Mine" with site 0 via (set RememberValue …);
//  - each Add move remembers its destination with (remember Value …);
//  - the legal destinations are the complement of the remembered set, read
//    back through (sites (values Remembered "Mine")).
const REMEMBER = `
(game "Remember"
    (players 1)
    (equipment {
        (board (rectangle 1 4))
        (piece "Disc" P1)
    })
    (rules
        (start (set RememberValue "Mine" (sites {0})))
        (play
            (move Add
                (to (difference (sites Empty) (sites (values Remembered "Mine"))))
                (then (remember Value "Mine" (last To)))
            )
        )
        (end (if (no Moves Mover) (result Mover Draw)))
    )
)`;

describe("LudemeGame: remembered-values subsystem", () => {
  it("seeds the remembered set from the start rule", () => {
    const game = compileLudemeSource(REMEMBER);
    const ctx = game.start();
    assert.deepEqual([...ctx.state.rememberedFor("Mine")], [0]);
  });

  it("excludes remembered sites from legal destinations", () => {
    const game = compileLudemeSource(REMEMBER);
    const ctx = game.start();
    // Site 0 is remembered at start, so destinations are 1, 2, 3.
    const dests = game.moves(ctx).map((m) => m.to()).sort((a, b) => a - b);
    assert.deepEqual(dests, [1, 2, 3]);
  });

  it("appends a destination to the remembered set after a move", () => {
    const game = compileLudemeSource(REMEMBER);
    const ctx = game.start();
    const toTwo = game.moves(ctx).find((m) => m.to() === 2);
    assert.ok(toTwo, "a move onto site 2 exists");
    const next = game.apply(ctx, toTwo);
    assert.deepEqual(
      [...next.state.rememberedFor("Mine")].sort((a, b) => a - b),
      [0, 2],
    );
  });
});
