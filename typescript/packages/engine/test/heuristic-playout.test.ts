import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FlatMonteCarloAI,
  HeuristicPlayout,
  SeededRng,
  ticTacToeGame,
} from "../src/index.js";

describe("HeuristicPlayout", () => {
  it("returns a legal move on the initial position", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const playout = new HeuristicPlayout();
    const move = playout.selectMove(ctx, new SeededRng(1));
    assert.ok(move);
    assert.equal(move.siteIndices.length, 1);
  });

  it("returns the only legal move when forced", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 1, 3, 2, 5, 4, 7, 8]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const playout = new HeuristicPlayout();
    const move = playout.selectMove(ctx, new SeededRng(1));
    assert.ok(move);
    assert.equal(move.siteIndices[0], 6);
  });

  it("plugs into FlatMonteCarloAI as a playout strategy", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new FlatMonteCarloAI({
      playoutsPerMove: 1,
      playout: new HeuristicPlayout(),
      seed: 11,
    });
    const move = ai.selectAction(ctx, { maxIterations: 9 });
    assert.ok(move);
  });
});
