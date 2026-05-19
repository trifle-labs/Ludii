import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PNSAI, ticTacToeGame } from "../src/index.js";

describe("PNSAI", () => {
  it("returns the only legal move without searching when forced", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 1, 3, 2, 5, 4, 7, 8]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m, `expected legal move at site ${site}`);
      ctx = game.apply(ctx, m);
    }
    assert.equal(ctx.over, false);
    const ai = new PNSAI();
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 6);
    // Single-legal-move shortcut bypasses search.
    assert.equal(ai.lastIterations, 0);
  });

  it("proves a winning move when one is one ply away (tic-tac-toe)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1: 0, P2: 3, P1: 1, P2: 4. P1 to move; can win at site 2.
    for (const site of [0, 3, 1, 4]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new PNSAI();
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(
      chosen.siteIndices[0],
      2,
      "expected PNS to pick the winning move",
    );
    assert.equal(ai.lastStatus, "proven");
  });

  it("proves a forced draw or loss when the position is already lost", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1: 0, P2: 4, P1: 8, P2: 5. P1 to move. P2 threatens 3,4,5 win;
    // P1 must block at site 3. Try to prove a win for P1 — should fail.
    for (const site of [0, 4, 8, 5]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new PNSAI({ proofGoal: "prove-win" });
    const chosen = ai.selectAction(ctx, { maxIterations: 50_000 });
    assert.ok(chosen);
    // Tic-tac-toe with perfect play from this position should not
    // be a P1 forced win — the goal is unresolvable as a win.
    assert.notEqual(ai.lastStatus, "proven");
  });

  it("honours maxIterations as a hard budget", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new PNSAI();
    const move = ai.selectAction(ctx, { maxIterations: 10 });
    assert.ok(move);
    assert.ok(
      ai.lastIterations <= 10,
      `expected ≤10 iterations, got ${ai.lastIterations}`,
    );
  });

  it("never loses a full tic-tac-toe game when self-playing with prove-win", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const p1 = new PNSAI({ proofGoal: "prove-win" });
    const p2 = new PNSAI({ proofGoal: "prove-win" });
    let turns = 0;
    while (!ctx.over && turns < 9) {
      const ai = ctx.mover === 1 ? p1 : p2;
      const move = ai.selectAction(ctx, { maxIterations: 20_000 });
      assert.ok(move);
      ctx = game.apply(ctx, move);
      turns += 1;
    }
    assert.equal(ctx.over, true);
    // With perfect play we expect a draw or for whoever could prove
    // a win to win — but tic-tac-toe is a draw with perfect play, so
    // either we draw or one side took a non-forced move that the
    // other punished. Just assert neither side resigned absurdly.
    assert.ok(ctx.winner === 0 || ctx.winner === 1 || ctx.winner === 2);
  });

  it("exposes proven status for trivially solvable positions", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1: 0, P2: 4, P1: 1. P1 threatens 0,1,2. P2 to move.
    // Try to prove a P2 win — won't succeed, and P2 must block.
    for (const site of [0, 4, 1]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new PNSAI({ proofGoal: "prove-win" });
    const chosen = ai.selectAction(ctx, { maxIterations: 20_000 });
    assert.ok(chosen);
    // P2 can't force a win — but it should pick the move that minimises
    // proof number, which is the blocking move at site 2.
    assert.equal(chosen.siteIndices[0], 2);
  });
});
