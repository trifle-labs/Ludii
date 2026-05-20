import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource, type Game } from "../src/index.js";

// A minimal sliding-piece game: a single rook per side on a 5x5 board.
// Site index = row*5 + col, origin (site 0) = A1 = bottom-left. The rook
// slides orthogonally to any empty square and may capture an enemy by
// landing on it (stopping there). Exercises the `(move Slide …)` ray walk,
// the empty/enemy `to:` guard, capture-and-stop, and coordinate placement.
const ROOK = `
(game "SlideTest"
    (players 2)
    (equipment {
        (board (square 5))
        (piece "Rook" Each
            (move Slide
                Orthogonal
                (to if:(or (is Empty (to)) ("IsEnemyAt" (to)))
                    (apply (remove (to)))
                )
            )
        )
    })
    (rules
        (start {
            (place "Rook1" {"C3"})
            (place "Rook2" {"C5"})
        })
        (play (forEach Piece))
        (end (if (= 0 (count Pieces Next)) (result Mover Win)))
    )
)
`;

// A bare `(move Slide)` with no direction: a chess-queen slide to empty in
// all eight compass directions. One queen alone on a 5x5 board.
const QUEEN = `
(game "QueenSlide"
    (players 2)
    (equipment {
        (board (square 5))
        (piece "Queen" Each (move Slide))
    })
    (rules
        (start (place "Queen1" {"C3"}))
        (play (forEach Piece))
        (end (if (= 1 0) (result Mover Win)))
    )
)
`;

function countOwner(ctx: Context, owner: number): number {
  let n = 0;
  for (const c of ctx.state.cells) if (c === owner) n += 1;
  return n;
}

describe("LudemeGame: interprets Slide movement", () => {
  it("places rooks via coordinates (C3 = site 12, C5 = site 22)", () => {
    const game = compileLudemeSource(ROOK);
    assert.equal(game.numSites, 25);
    const ctx = game.start();
    assert.equal(ctx.state.cells[12], 1, "Rook1 on C3");
    assert.equal(ctx.state.cells[22], 2, "Rook2 on C5");
    assert.equal(countOwner(ctx, 1), 1);
    assert.equal(countOwner(ctx, 2), 1);
  });

  it("slides orthogonally to every empty square, stopping at the enemy", () => {
    const game = compileLudemeSource(ROOK);
    const ctx = game.start();
    const tos = game
      .moves(ctx)
      .filter((m) => m.from() === 12)
      .map((m) => m.to())
      .sort((a, b) => a - b);
    // From C3 (12): N reaches 17 then captures at 22 (stop, not 7/no wrap);
    // S reaches 7,2; E reaches 13,14; W reaches 11,10. No diagonals.
    assert.deepEqual(tos, [2, 7, 10, 11, 13, 14, 17, 22]);
  });

  it("does not slide through or past a blocker", () => {
    const game = compileLudemeSource(ROOK);
    const ctx = game.start();
    // Site 22 (the enemy) is reachable; site beyond it on the same ray would
    // be off-board here, but the key invariant is the enemy is the terminus.
    const north = game
      .moves(ctx)
      .filter((m) => m.from() === 12 && (m.to() === 17 || m.to() === 22));
    assert.equal(north.length, 2);
  });

  it("captures by landing on the enemy and ends the game", () => {
    const game: Game = compileLudemeSource(ROOK);
    const ctx = game.start();
    const capture = game.moves(ctx).find((m) => m.from() === 12 && m.to() === 22);
    assert.ok(capture, "capture C3->C5 available");
    const next = game.apply(ctx, capture);
    assert.equal(next.state.cells[22], 1, "Rook1 now on C5");
    assert.equal(next.state.cells[12], 0, "vacated origin");
    assert.equal(countOwner(next, 2), 0, "enemy rook removed");
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("a bare (move Slide) slides in all eight directions", () => {
    const game = compileLudemeSource(QUEEN);
    const ctx = game.start();
    const tos = new Set(game.moves(ctx).map((m) => m.to()));
    // Queen on C3 (12) on an empty 5x5: orthogonals 2,7,17,22 / 10,11,13,14
    // plus diagonals 0,6,18,24 (SW/…/NE) and 4,8,16,20 (SE/…/NW).
    for (const s of [
      2, 7, 17, 22, 10, 11, 13, 14, 0, 6, 18, 24, 4, 8, 16, 20,
    ]) {
      assert.ok(tos.has(s), `queen should reach site ${s}`);
    }
    // 16 reachable squares from the centre of a 5x5; no self-square.
    assert.equal(tos.size, 16);
    assert.equal(tos.has(12), false);
  });
});
