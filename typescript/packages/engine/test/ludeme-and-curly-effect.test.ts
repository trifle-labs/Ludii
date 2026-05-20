import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(and { <eff> … })` passes its sub-effects as a single curly-list argument
// rather than as positional arguments. The effect compiler must flatten that
// curly block into a sequence and run every member. This pattern is pervasive
// in mancala capture defines, e.g. `(and { (fromTo …) (moveAgain) (set Var …) })`.
// Here an Add move's `(then …)` runs two effects bundled in a curly block.
const AND_CURLY = `
(game "AndCurly"
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
        (play
            (move Add (to (sites {1}))
                (then (and { (set Var "X" 7) (set Score Mover 3) }))
            )
        )
        (end (if (= (count Pieces P1) 9) (result P1 Win)))
    )
)`;

describe("LudemeGame: (and { … }) curly-block effect", () => {
  it("runs every sub-effect in a flattened curly block", () => {
    const game = compileLudemeSource(AND_CURLY);
    const ctx = game.start();
    const move = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(move, "the Add move onto the empty centre exists");
    const next = game.apply(ctx, move);
    assert.equal(next.state.getVar("X"), 7, "(set Var …) ran");
    assert.equal(next.state.score(1), 3, "(set Score …) ran");
    assert.equal(next.state.cells[1], 1, "the Add itself still applied");
  });
});
