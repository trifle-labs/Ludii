import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HeuristicSampling, ticTacToeGame } from "../src/index.js";

describe("HeuristicSampling", () => {
  it("returns the only legal move without searching when forced", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 1, 3, 2, 5, 4, 7, 8]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new HeuristicSampling({ seed: 1, fraction: 1 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 6);
  });

  it("returns an immediate-winning move when one exists (fraction=1)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 3, 1, 4]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    // fraction=1 means consider every move.
    const ai = new HeuristicSampling({ seed: 1, fraction: 1 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 2);
  });

  it("plays a complete game without throwing (self-play)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const ai = new HeuristicSampling({ seed: 7, fraction: 2 });
    let turns = 0;
    while (!ctx.over && turns < 12) {
      const move = ai.withSeed(turns + 1).selectAction(ctx);
      assert.ok(move);
      ctx = game.apply(ctx, move);
      turns += 1;
    }
    assert.ok(ctx.over || turns >= 9);
  });
});
