import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource } from "../src/index.js";

// The generic relocation move: (move (from <region>?) (to <region> …)). Site
// index = row*W + col, origin (site 0) = bottom-left (A1).

// A single white piece on a 3x3 that may relocate to any empty cell. With no
// (from …) clause the from-site defaults to the mover's occupied cells.
const WANDER = `
(game "Wander"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" Each)
    })
    (rules
        (start (place "Disc1" {"B2"}))
        (play (move (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

// Explicit (from <region>) (to <region>) with a capture via (apply (remove …)).
const CAPTURE = `
(game "CaptureMove"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" Each)
    })
    (rules
        (start { (place "Disc1" {"A1"}) (place "Disc2" {"A2"}) })
        (play
            (move
                (from (sites Occupied by:Mover))
                (to (sites Around (from) Orthogonal)
                    if:("IsEnemyAt" (to))
                    (apply (remove (to)))
                )
            )
        )
        (end (if (= 0 (count Pieces Next)) (result Mover Win)))
    )
)`;

describe("LudemeGame: generic (move (from …) (to …))", () => {
  it("relocates the mover's piece to every empty site (from defaults to owned)", () => {
    const game = compileLudemeSource(WANDER);
    const ctx = game.start();
    // B2 is site 4 on a 3x3; the eight other cells are empty.
    const moves = game.moves(ctx);
    const tos = moves.map((m) => m.to()).sort((a, b) => a - b);
    assert.deepEqual(tos, [0, 1, 2, 3, 5, 6, 7, 8], "8 destinations");
    assert.ok(
      moves.every((m) => m.from() === 4),
      "every move originates at B2 (site 4)",
    );
  });

  it("applying a relocation clears the origin and fills the destination", () => {
    const game = compileLudemeSource(WANDER);
    const ctx = game.start();
    const move = game.moves(ctx).find((m) => m.to() === 0);
    assert.ok(move, "a move to A1 exists");
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[4], 0, "origin B2 emptied");
    assert.equal(next.state.cells[0], 1, "destination A1 now holds P1");
  });

  it("captures an orthogonally-adjacent enemy and removes it", () => {
    const game = compileLudemeSource(CAPTURE);
    const ctx = game.start();
    // P1 Disc at A1 (site 0); P2 Disc at A2 (site 3). Only legal capture is
    // the relocation A1→A2 landing on the enemy.
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1, "exactly one capture");
    const move = moves[0];
    assert.ok(move);
    assert.equal(move.from(), 0);
    assert.equal(move.to(), 3);
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[0], 0, "origin emptied");
    assert.equal(next.state.cells[3], 1, "P1 now occupies the enemy's cell");
    assert.equal(next.over, true, "no enemy pieces remain → win");
    assert.equal(next.winner, 1);
  });

  it("offers no move when no destination passes the to-guard", () => {
    // Same as CAPTURE but the enemy is diagonal, so the Orthogonal ring around
    // A1 (only B1 and A2) holds no enemy → zero captures.
    const src = `
(game "NoCapture"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (start { (place "Disc1" {"A1"}) (place "Disc2" {"B2"}) })
        (play
            (move (from (sites Occupied by:Mover))
                  (to (sites Around (from) Orthogonal) if:("IsEnemyAt" (to))
                      (apply (remove (to))))))
        (end (if (= 0 (count Pieces Next)) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx: Context = game.start();
    // Raw play moves: with no capturable enemy the play rules yield nothing.
    // (`moves()` would substitute a forced Pass per Java Trial.setLegalMoves.)
    assert.equal(
      game.legalMovesRaw(ctx).length,
      0,
      "no orthogonal enemy to capture",
    );
  });
});
