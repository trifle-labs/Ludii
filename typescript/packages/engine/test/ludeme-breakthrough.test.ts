import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource, type Game } from "../src/index.js";

// The real Common/res/lud/board/race/reach/Breakthrough.lud, inlined with
// the 8x8 square option pre-applied so the test is self-contained. It still
// exercises the builtin-define expansion path: ("TwoPlayersNorthSouth"),
// the bare "StepForwardToEmpty", ("IsEnemyAt" …) and ("ReachWin" …).
const BREAKTHROUGH = `
(game "Breakthrough"
    ("TwoPlayersNorthSouth")
    (equipment {
        (board (square 8))
        (piece "Pawn" Each
            (or {
                "StepForwardToEmpty"
                (move
                    Step
                    (directions {FR FL})
                    (to if:(or
                            (is Empty (to))
                            ("IsEnemyAt" (to))
                        )
                        (apply (remove (to)))
                    )
                )
            })
        )
        (regions P1 (sites Top))
        (regions P2 (sites Bottom))
    })
    (rules
        (start {
            (place "Pawn1" (expand (sites Bottom)))
            (place "Pawn2" (expand (sites Top)))
        })
        (play (forEach Piece))
        (end ("ReachWin" (sites Mover) Mover))
    )
)
`;

function countOwner(ctx: Context, owner: number): number {
  let n = 0;
  for (const c of ctx.state.cells) if (c === owner) n += 1;
  return n;
}

describe("LudemeGame: interprets Breakthrough movement", () => {
  it("sets up two rows of pawns per player on an 8x8 board", () => {
    const game = compileLudemeSource(BREAKTHROUGH);
    assert.equal(game.numSites, 64);
    const ctx = game.start();
    // P1 (owner 1) fills the bottom two rows (sites 0–15), P2 the top two.
    assert.equal(countOwner(ctx, 1), 16);
    assert.equal(countOwner(ctx, 2), 16);
    for (let s = 0; s < 16; s += 1) assert.equal(ctx.state.cells[s], 1);
    for (let s = 48; s < 64; s += 1) assert.equal(ctx.state.cells[s], 2);
  });

  it("generates 22 opening moves, not 64 placements", () => {
    const game = compileLudemeSource(BREAKTHROUGH);
    const ctx = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 22);
  });

  it("opening moves are relocations from the front rank only", () => {
    const game = compileLudemeSource(BREAKTHROUGH);
    const ctx = game.start();
    for (const m of game.moves(ctx)) {
      // Every move relocates a piece (ActionMove), never an Add placement.
      assert.equal(m.actionType(), "Move");
      // The moving pawn always starts on row 1 (sites 8–15); the back rank
      // (row 0) is fully blocked by its own front rank.
      assert.ok(m.from() >= 8 && m.from() <= 15, `from ${m.from()} not row 1`);
    }
  });

  it("alternates to P2, which also has 22 symmetric replies", () => {
    const game = compileLudemeSource(BREAKTHROUGH);
    let ctx: Context = game.start();
    const first = game.moves(ctx)[0];
    assert.ok(first);
    ctx = game.apply(ctx, first);
    assert.equal(ctx.mover, 2);
    assert.equal(ctx.over, false);
    assert.equal(game.moves(ctx).length, 22);
  });

  it("captures diagonally by overwriting the enemy pawn", () => {
    // Site index = row*8 + col, row 0 = P1's home edge. Drive P1's b-file
    // pawn up to b6 (site 41, row 5) while P2 shuffles its far h/g/f/e-file
    // pawns, leaving a6 (48) and c6 (50) in place. From b6 the pawn's FL/FR
    // diagonals land on those two enemy pawns.
    const game: Game = compileLudemeSource(BREAKTHROUGH);
    let ctx: Context = game.start();
    const step = (from: number, to: number): void => {
      const m = game.moves(ctx).find((x) => x.from() === from && x.to() === to);
      assert.ok(m, `expected a move ${from}->${to}`);
      ctx = game.apply(ctx, m);
    };
    step(9, 17); // P1 b2->b3
    step(55, 47); // P2 h7->h6
    step(17, 25); // P1 b3->b4
    step(54, 46); // P2 g7->g6
    step(25, 33); // P1 b4->b5
    step(53, 45); // P2 f7->f6
    step(33, 41); // P1 b5->b6  (now adjacent to a6=48 and c6=50)
    step(52, 44); // P2 e7->e6  (a6/b6/c6 untouched)

    assert.equal(ctx.mover, 1);
    const captures = game
      .moves(ctx)
      .filter((m) => m.from() === 41 && (m.to() === 48 || m.to() === 50));
    assert.equal(captures.length, 2, "both diagonal captures available");

    const enemyBefore = countOwner(ctx, 2);
    const capture = captures[0];
    assert.ok(capture);
    const next = game.apply(ctx, capture);
    assert.equal(countOwner(next, 2), enemyBefore - 1, "enemy pawn removed");
    assert.equal(next.state.cells[capture.to()], 1, "P1 now occupies it");
    assert.equal(next.state.cells[41], 0, "vacated origin");
  });
});
