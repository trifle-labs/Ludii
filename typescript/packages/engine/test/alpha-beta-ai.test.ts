import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AlphaBetaAI,
  type Context,
  type Evaluator,
  MaterialEvaluator,
  ticTacToeGame,
} from "../src/index.js";

describe("AlphaBetaAI", () => {
  it("returns the only legal move without searching when forced", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // Fill eight of nine cells without producing a line, leaving site 6
    // as the only legal move for P1.
    for (const site of [0, 1, 3, 2, 5, 4, 7, 8]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m, `expected legal move at site ${site}`);
      ctx = game.apply(ctx, m);
    }
    assert.equal(ctx.over, false);
    const ai = new AlphaBetaAI();
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(chosen.siteIndices[0], 6);
    // Forced moves bypass the search — no nodes visited.
    assert.equal(ai.lastNodesVisited, 0);
  });

  it("plays a winning move when one is one ply away (tic-tac-toe)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // Hand-craft a position where P1 has two in a row on the top row.
    // P1: 0, P2: 3, P1: 1, P2: 4. P1 to move; winning at site 2.
    for (const site of [0, 3, 1, 4]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new AlphaBetaAI({ defaultDepth: 2 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(
      chosen.siteIndices[0],
      2,
      "expected the AI to take the winning third-row cell",
    );
  });

  it("blocks an opponent's winning move (tic-tac-toe)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1: 0, P2: 3, P1: 1. P2 to move; must block at site 2.
    for (const site of [0, 3, 1]) {
      const m = game.moves(ctx).find((mv) => mv.siteIndices[0] === site);
      assert.ok(m);
      ctx = game.apply(ctx, m);
    }
    const ai = new AlphaBetaAI({ defaultDepth: 3 });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    assert.equal(
      chosen.siteIndices[0],
      2,
      "expected the AI to block the opponent's three-in-a-row",
    );
  });

  it("never loses a full tic-tac-toe game when self-playing (always draws)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const p1 = new AlphaBetaAI({ defaultDepth: 9 });
    const p2 = new AlphaBetaAI({ defaultDepth: 9 });
    let turns = 0;
    while (!ctx.over && turns < 9) {
      const ai = ctx.mover === 1 ? p1 : p2;
      const move = ai.selectAction(ctx);
      assert.ok(move);
      ctx = game.apply(ctx, move);
      turns += 1;
    }
    assert.equal(ctx.over, true);
    // Perfect tic-tac-toe play always draws.
    assert.equal(ctx.winner, 0);
  });

  it("reports increasing depth across iterations of iterative deepening", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new AlphaBetaAI({ defaultDepth: 3 });
    ai.selectAction(ctx);
    assert.ok(
      ai.lastDepthReached >= 1,
      `expected the search to complete at least one iteration; got depth=${ai.lastDepthReached}`,
    );
    assert.ok(ai.lastNodesVisited > 0, "expected visited-node counter to grow");
  });

  it("honours maxIterations as a hard budget on visited nodes", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new AlphaBetaAI({ defaultDepth: 9 });
    const move = ai.selectAction(ctx, { maxIterations: 200 });
    assert.ok(move);
    // Allow some slack — we check the budget per-move during recursion,
    // so a small overshoot is expected. But it must not run the full 9-ply
    // tree (which would be tens of thousands of nodes).
    assert.ok(
      ai.lastNodesVisited <= 400,
      `expected ≤400 nodes with budget=200, got ${ai.lastNodesVisited}`,
    );
  });
});

describe("MaterialEvaluator", () => {
  it("returns owned-cell delta from the root player's perspective", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const m1 = game.moves(ctx).find((mv) => mv.siteIndices[0] === 0);
    assert.ok(m1);
    ctx = game.apply(ctx, m1);
    const m2 = game.moves(ctx).find((mv) => mv.siteIndices[0] === 4);
    assert.ok(m2);
    ctx = game.apply(ctx, m2);
    // After P1@0, P2@4: one cell each.
    const ev = new MaterialEvaluator();
    assert.equal(ev.evaluate(ctx, 1), 0);
    assert.equal(ev.evaluate(ctx, 2), 0);
  });

  it("respects a custom evaluator passed to AlphaBetaAI", () => {
    // Trivial evaluator: prefer corners (site 0, 2, 6, 8 in a 3×3 board).
    const corners = new Set([0, 2, 6, 8]);
    const evaluator: Evaluator = {
      evaluate(context: Context, rootPlayer: number): number {
        const state = context.state;
        let score = 0;
        for (let i = 0; i < state.cells.length; i += 1) {
          if (state.cells[i] === rootPlayer && corners.has(i)) score += 1;
        }
        return score;
      },
    };
    const game = ticTacToeGame();
    const ctx = game.start();
    const ai = new AlphaBetaAI({ defaultDepth: 1, evaluator });
    const chosen = ai.selectAction(ctx);
    assert.ok(chosen);
    // The corner evaluator should pick one of the four corners on an
    // empty board.
    assert.ok(
      corners.has(chosen.siteIndices[0] ?? -1),
      `expected a corner pick; got site ${chosen.siteIndices[0]}`,
    );
  });
});
