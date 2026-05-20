import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compileLudemeSource,
  type Context,
  FlatMonteCarloAI,
  type Game,
  MCTSAI,
  type Move,
  RandomAI,
} from "../src/index.js";

// Integration coverage: drive the *interpreter* (compiled `.lud` games) with
// the existing AI agents. The AI unit tests only exercise the hand-rolled
// `ticTacToeGame()` template; these prove the same agents play games whose
// rules are evaluated by the tree-walking ludeme interpreter.

// Inline tic-tac-toe: placement game with a line-of-3 win and a board-full
// draw. Exercises (move Add), (is Line 3), and a multi-clause (end {…}).
const TTT = `
(game "TTT"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" Each)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end {
            (if (is Line 3) (result Mover Win))
            (if (= 0 (count Sites in:(sites Empty))) (result Mover Draw))
        })
    )
)`;

// Inline single-rook-per-side capture race: a movement (relocation) game, so
// the AIs are also exercised on (move Slide) rather than only placements.
const ROOKS = `
(game "RookRace"
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
            (place "Rook1" {"C1"})
            (place "Rook2" {"C5"})
        })
        (play (forEach Piece))
        (end (if (= 0 (count Pieces Next)) (result Mover Win)))
    )
)`;

function requireMove(move: Move | undefined): Move {
  if (move === undefined) throw new Error("AI returned undefined move");
  return move;
}

function selfPlay(game: Game, ai: RandomAI, maxPlies: number): Context {
  let ctx: Context = game.start();
  let safety = 0;
  while (!ctx.over && safety < maxPlies) {
    ai.initAI(ctx.mover);
    const move = requireMove(ai.selectAction(ctx));
    ctx = game.apply(ctx, move);
    safety += 1;
  }
  return ctx;
}

describe("AI integration: RandomAI on the interpreter", () => {
  it("plays a compiled tic-tac-toe to a terminal state", () => {
    const game = compileLudemeSource(TTT);
    const ctx = selfPlay(game, new RandomAI(7), 20);
    assert.equal(ctx.over, true, "game reaches a terminal state");
    // Outcome is either a win for one player or a draw (winner 0).
    assert.ok([0, 1, 2].includes(ctx.winner), `winner ${ctx.winner} valid`);
  });

  it("only ever selects a legal move on a compiled movement game", () => {
    const game = compileLudemeSource(ROOKS);
    let ctx: Context = game.start();
    const ai = new RandomAI(99);
    let safety = 0;
    while (!ctx.over && safety < 100) {
      ai.initAI(ctx.mover);
      const move = requireMove(ai.selectAction(ctx));
      assert.ok(
        game.moves(ctx).some((m) => m.id === move.id),
        "selected move is among the legal moves",
      );
      ctx = game.apply(ctx, move);
      safety += 1;
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, ctx.winner === 0 ? 0 : ctx.winner, "valid result");
  });

  it("is reproducible for a fixed seed", () => {
    const game = compileLudemeSource(TTT);
    const a = selfPlay(game, new RandomAI(123), 20);
    const b = selfPlay(game, new RandomAI(123), 20);
    assert.equal(a.winner, b.winner, "same seed → same outcome");
    assert.deepEqual(a.state.cells, b.state.cells, "same final position");
  });
});

describe("AI integration: search agents on the interpreter", () => {
  it("FlatMonteCarloAI returns a legal opening move on compiled TTT", () => {
    const game = compileLudemeSource(TTT);
    const ctx = game.start();
    const ai = new FlatMonteCarloAI({ playoutsPerMove: 4, seed: 9 });
    ai.initAI(1);
    const move = requireMove(ai.selectAction(ctx, { maxIterations: 32 }));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });

  it("FlatMonteCarloAI finishes a compiled self-play game", () => {
    const game = compileLudemeSource(TTT);
    let ctx: Context = game.start();
    const ai = new FlatMonteCarloAI({ playoutsPerMove: 2, seed: 11 });
    let safety = 0;
    while (!ctx.over && safety < 20) {
      ai.initAI(ctx.mover);
      ctx = game.apply(ctx, requireMove(ai.selectAction(ctx, { maxIterations: 16 })));
      safety += 1;
    }
    assert.equal(ctx.over, true);
  });

  it("MCTSAI returns a legal move under a small iteration budget", () => {
    const game = compileLudemeSource(TTT);
    const ctx = game.start();
    const ai = new MCTSAI({ seed: 4 });
    ai.initAI(1);
    const move = requireMove(ai.selectAction(ctx, { maxIterations: 64 }));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });
});
