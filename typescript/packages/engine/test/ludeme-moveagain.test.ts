import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource, type Game } from "../src/index.js";

// A turn-model probe. On a 2x2 board, the play rule branches on the parity of
// the move count: on an even count the Add move carries `(then (moveAgain))`
// so the same player moves again; on an odd count it is a plain Add that
// passes the turn. Exercises `(if <bool> <movesA> <movesB>)` move selection,
// `(count Moves)`, `(is Even …)`, and the `moveAgain` turn flag.
const PHASE_ADD = `
(game "PhaseAdd"
    (players 2)
    (equipment {
        (board (square 2))
    })
    (rules
        (play
            (if (is Even (count Moves))
                (move Add (to (sites Empty)) (then (moveAgain)))
                (move Add (to (sites Empty)))
            )
        )
        (end (if (= 0 (count Sites in:(sites Empty))) (result Mover Draw)))
    )
)
`;

describe("LudemeGame: interprets the moveAgain turn flag", () => {
  it("keeps the same mover after a (then (moveAgain)) move", () => {
    const game = compileLudemeSource(PHASE_ADD);
    const ctx = game.start();
    assert.equal(ctx.mover, 1, "P1 to start");
    // Move count 0 is even → every offered move is tagged moveAgain.
    const moves = game.moves(ctx);
    assert.equal(moves.length, 4, "four empty cells, four placements");
    for (const m of moves) {
      assert.equal(m.moveAgain, true, "even-count moves re-move");
    }
    const next = game.apply(ctx, moves[0] as (typeof moves)[number]);
    assert.equal(next.mover, 1, "mover unchanged after moveAgain");
  });

  it("passes the turn after a plain (odd-count) move", () => {
    const game: Game = compileLudemeSource(PHASE_ADD);
    let ctx: Context = game.start();
    ctx = game.apply(ctx, game.moves(ctx)[0] as never); // move 0 (even): re-move
    assert.equal(ctx.mover, 1);
    // Now move count is 1 (odd) → plain placements, no moveAgain.
    const odd = game.moves(ctx);
    assert.equal(odd.length, 3);
    for (const m of odd) assert.equal(m.moveAgain, false, "odd move passes turn");
    ctx = game.apply(ctx, odd[0] as never);
    assert.equal(ctx.mover, 2, "turn passed to P2");
  });

  it("fills the board and ends as a draw", () => {
    const game = compileLudemeSource(PHASE_ADD);
    let ctx: Context = game.start();
    let guard = 0;
    while (!ctx.over && guard < 10) {
      const ms = game.moves(ctx);
      assert.ok(ms.length > 0, "moves available until the board fills");
      ctx = game.apply(ctx, ms[0] as never);
      guard += 1;
    }
    assert.equal(ctx.over, true, "game terminates");
    assert.equal(ctx.winner, 0, "full board is a draw");
    for (const c of ctx.state.cells) assert.notEqual(c, 0, "no empty cell left");
  });
});
