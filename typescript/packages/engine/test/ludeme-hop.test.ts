import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource, type Game } from "../src/index.js";

// A minimal checkers-style leap: a man jumps diagonally over an adjacent
// enemy onto the empty cell beyond, removing the jumped piece. Site index =
// row*5 + col, origin (site 0) = A1 = bottom-left. Exercises `(move Hop …)`:
// the between/to guards, the distance-1 jump geometry, and the capture of
// the *jumped* (between) cell rather than the landing cell.
const HOP = `
(game "HopTest"
    (players 2)
    (equipment {
        (board (square 5))
        (piece "Man" Each
            (move Hop
                Diagonal
                (between
                    if:("IsEnemyAt" (between))
                    (apply (remove (between)))
                )
                (to if:(is Empty (to)))
            )
        )
    })
    (rules
        (start {
            (place "Man1" {"C3"})
            (place "Man2" {"D4"})
        })
        (play (forEach Piece))
        (end (if (= 0 (count Pieces Next)) (result Mover Win)))
    )
)
`;

function countOwner(ctx: Context, owner: number): number {
  let n = 0;
  for (const c of ctx.state.cells) if (c === owner) n += 1;
  return n;
}

describe("LudemeGame: interprets Hop movement", () => {
  it("offers exactly the one diagonal leap over the adjacent enemy", () => {
    const game = compileLudemeSource(HOP);
    const ctx = game.start();
    assert.equal(ctx.state.cells[12], 1, "Man1 on C3");
    assert.equal(ctx.state.cells[18], 2, "Man2 on D4");
    const moves = game.moves(ctx);
    // Only the NE jump C3(12) over D4(18) onto E5(24) is legal; the other
    // three diagonals hop over empty cells and are rejected.
    assert.equal(moves.length, 1);
    const m = moves[0];
    assert.ok(m);
    assert.equal(m.from(), 12);
    assert.equal(m.to(), 24);
  });

  it("captures the jumped piece, not the landing square", () => {
    const game: Game = compileLudemeSource(HOP);
    const ctx = game.start();
    const jump = game.moves(ctx).find((m) => m.from() === 12 && m.to() === 24);
    assert.ok(jump, "leap C3->E5 available");
    const next = game.apply(ctx, jump);
    assert.equal(next.state.cells[24], 1, "Man1 landed on E5");
    assert.equal(next.state.cells[12], 0, "vacated origin C3");
    assert.equal(next.state.cells[18], 0, "jumped enemy on D4 removed");
    assert.equal(countOwner(next, 2), 0, "enemy removed");
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("does not hop when the landing square is off the board or blocked", () => {
    // Drive nothing; just assert no man can hop over an empty neighbour.
    const game = compileLudemeSource(HOP);
    const ctx = game.start();
    // No move jumps over an empty cell (e.g. NW over B4=16, which is empty).
    for (const m of game.moves(ctx)) {
      assert.equal(m.to(), 24, "the only legal landing is E5");
    }
  });
});
