import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 3x3 board (sites 0..8, row-major from the bottom-left; the centre is site
// 4). P1 faces North. Each game gates an Add move behind a comparison of
// (ahead 4 <direction>) against the expected neighbour of the centre, so the
// move is legal (8 empty sites) only when `ahead` resolves correctly.
const mk = (cond: string): string => `
(game "AheadProbe"
    (players 1)
    (equipment {
        (board (square 3))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {4})))
        (play (if ${cond} (move Add (to (sites Empty)))))
        (end (if (>= (count Pieces Mover) 2) (result Mover Win)))
    )
)`;

function legalCount(cond: string): number {
  const game = compileLudemeSource(mk(cond));
  // Count the *raw* play-rule moves, not `moves()`: when the gate fails the
  // play rules yield nothing and `moves()` would substitute a forced Pass
  // (Java Trial.setLegalMoves), which is not what this probe is measuring.
  return game.legalMovesRaw(game.start()).length;
}

describe("LudemeGame: (ahead <site> <direction>)", () => {
  it("steps one site in absolute compass directions", () => {
    assert.equal(legalCount("(= (ahead 4 S) 1)"), 8, "south of centre is 1");
    assert.equal(legalCount("(= (ahead 4 N) 7)"), 8, "north of centre is 7");
    assert.equal(legalCount("(= (ahead 4 E) 5)"), 8, "east of centre is 5");
    assert.equal(legalCount("(= (ahead 4 W) 3)"), 8, "west of centre is 3");
    assert.equal(
      legalCount("(= (ahead 4 steps:1 (directions Cell from:0 to:4)) 8)"),
      8,
      "from-to directions step one more site along the same radial",
    );
  });

  it("returns the source site when the step leaves the board", () => {
    // Site 0 is the bottom-left corner; stepping South leaves the board.
    // Java Ahead.java falls back to the original site when the radial is too
    // short; Neutron uses this as its edge clamp.
    assert.equal(legalCount("(= (ahead 0 S) 0)"), 8, "off-board clamps to 0");
  });

  it("does not match an incorrect target", () => {
    assert.equal(legalCount("(= (ahead 4 S) 99)"), 0, "site 1 is not 99");
  });
});
