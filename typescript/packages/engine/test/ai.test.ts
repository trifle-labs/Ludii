import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BigramStats,
  FlatMonteCarloAI,
  MASTPlayout,
  MCTSAI,
  type Move,
  MoveStats,
  NSTPlayout,
  RandomAI,
  RandomPlayout,
  scoreForPlayer,
  ticTacToeGame,
} from "../src/index.js";

function requireMove(move: Move | undefined): Move {
  if (move === undefined) throw new Error("AI returned undefined move");
  return move;
}

describe("RandomAI", () => {
  it("returns one of the legal moves at the root", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new RandomAI(42);
    ai.initAI(1);
    const move = requireMove(ai.selectAction(ctx));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });

  it("is deterministic for a fixed seed", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const a = new RandomAI(1234);
    a.initAI(1);
    const b = new RandomAI(1234);
    b.initAI(1);
    assert.equal(a.selectAction(ctx)?.id, b.selectAction(ctx)?.id);
  });

  it("can play a full game without throwing", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const ai = new RandomAI(7);
    let safety = 0;
    while (!ctx.over && safety < 100) {
      const move = requireMove(ai.selectAction(ctx));
      ctx = game.apply(ctx, move);
      safety += 1;
    }
    assert.ok(ctx.over);
  });
});

describe("FlatMonteCarloAI", () => {
  it("returns a legal move on the empty board", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new FlatMonteCarloAI({ playoutsPerMove: 4, seed: 9 });
    ai.initAI(1);
    const move = requireMove(ai.selectAction(ctx, { maxIterations: 32 }));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });

  it("can finish a self-play game", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const ai = new FlatMonteCarloAI({ playoutsPerMove: 2, seed: 11 });
    let safety = 0;
    while (!ctx.over && safety < 100) {
      const move = requireMove(ai.selectAction(ctx, { maxIterations: 16 }));
      ctx = game.apply(ctx, move);
      safety += 1;
    }
    assert.ok(ctx.over);
  });
});

describe("MCTSAI", () => {
  it("returns a legal move", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new MCTSAI({ seed: 4 });
    ai.initAI(1);
    const move = requireMove(ai.selectAction(ctx, { maxIterations: 64 }));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });

  it("with enough iterations, won't blunder when one move wins immediately", () => {
    // Set up a position where the mover (X = 1) wins by playing site 2:
    //   X | X | .          row complete on top after playing 2
    //   . | O | .
    //   . | . | O
    const game = ticTacToeGame();
    let ctx = game.start();
    const applySite = (site: number): void => {
      const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
      if (!move) throw new Error(`No legal move at site ${site}`);
      ctx = game.apply(ctx, move);
    };
    applySite(0);
    applySite(4);
    applySite(1);
    applySite(8);

    const ai = new MCTSAI({ seed: 21 });
    const move = ai.selectAction(ctx, { maxIterations: 1024 });
    assert.equal(move?.siteIndices[0], 2);
  });
});

describe("RandomPlayout", () => {
  it("yields legal moves only", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const playout = new RandomPlayout();
    const move = requireMove(playout.selectMove(ctx, ctx.rng));
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });
});

describe("MAST / NST / ProgressiveHistory / AlphaGoBackprop", () => {
  it("MoveStats records a running per-move mean", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const stats = new MoveStats();
    const [a, b] = game.moves(ctx);
    if (!a || !b) throw new Error("expected at least 2 moves");
    stats.update(a, 1);
    stats.update(a, -1);
    stats.update(b, 1);
    assert.equal(stats.mean(a), 0);
    assert.equal(stats.mean(b), 1);
    assert.equal(stats.visits(a), 2);
  });

  it("MASTPlayout returns a legal move", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const stats = new MoveStats();
    // Seed the stats so softmax has a clear preference.
    const moves = game.moves(ctx);
    if (!moves[0]) throw new Error("no moves");
    stats.update(moves[0], 10);
    const playout = new MASTPlayout({ stats, epsilon: 0 });
    const move = playout.selectMove(ctx, ctx.rng);
    assert.ok(move);
    assert.ok(moves.some((m) => m.id === move.id));
  });

  it("NSTPlayout returns a legal move", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const stats = new MoveStats();
    const bigram = new BigramStats();
    const playout = new NSTPlayout({
      stats,
      bigramStats: bigram,
      epsilon: 0,
    });
    const move = playout.selectMove(ctx, ctx.rng);
    assert.ok(move);
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
  });

  it("MCTSAI with ProgressiveHistory and shared MoveStats still picks a legal move", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const stats = new MoveStats();
    const ai = new MCTSAI({
      seed: 17,
      moveStats: stats,
      progressiveHistoryWeight: 0.5,
    });
    const move = ai.selectAction(ctx, { maxIterations: 128 });
    assert.ok(move);
    assert.ok(game.moves(ctx).some((m) => m.id === move.id));
    // Stats should have been populated by playouts.
    assert.ok(stats.size() > 0);
  });

  it("MCTSAI with AlphaGo-style blend (alpha=0.5) still finds the winning move", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const applySite = (site: number): void => {
      const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
      if (!move) throw new Error(`No legal move at site ${site}`);
      ctx = game.apply(ctx, move);
    };
    applySite(0);
    applySite(4);
    applySite(1);
    applySite(8);

    const stats = new MoveStats();
    const ai = new MCTSAI({
      seed: 21,
      moveStats: stats,
      alphaGoBlend: 0.5,
    });
    const move = ai.selectAction(ctx, { maxIterations: 1024 });
    assert.equal(move?.siteIndices[0], 2);
  });
});

describe("scoreForPlayer", () => {
  it("returns 0 when the game is not over", () => {
    const game = ticTacToeGame();
    assert.equal(scoreForPlayer(game.start(), 1), 0);
  });
});
