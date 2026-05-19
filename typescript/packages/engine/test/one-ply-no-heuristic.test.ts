import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OnePlyNoHeuristic, ticTacToeGame } from "../src/index.js";

describe("OnePlyNoHeuristic", () => {
  it("returns the only legal move without scoring when forced", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 1, 3, 2, 5, 4, 7, 8]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new OnePlyNoHeuristic({ seed: 1 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 6);
  });

  it("plays an immediate winning move (tic-tac-toe)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1: 0, P2: 3, P1: 1, P2: 4. P1 wins by playing 2.
    for (const site of [0, 3, 1, 4]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new OnePlyNoHeuristic({ seed: 1 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 2);
  });

  it("is deterministic for a given seed", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const a = new OnePlyNoHeuristic({ seed: 42 }).selectAction(ctx);
    const b = new OnePlyNoHeuristic({ seed: 42 }).selectAction(ctx);
    assert.ok(a && b);
    assert.deepEqual(a.siteIndices, b.siteIndices);
  });
});
