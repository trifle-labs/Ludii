import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FlatBoardGame, HexGame, ticTacToeGame } from "../src/index.js";

describe("Game.concepts", () => {
  it("FlatBoardGame reports line/draw structural concepts", () => {
    const game = ticTacToeGame();
    const c = game.concepts?.();
    assert.ok(c);
    assert.equal(c.has("LineWin"), true);
    assert.equal(c.has("DrawByFill"), true);
    assert.equal(c.has("AlternatingTurns"), true);
    assert.equal(c.has("Add"), true);
  });

  it("FlatBoardGame unions move concepts when given a context", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const c = game.concepts?.(ctx);
    assert.ok(c);
    assert.equal(c.has("Add"), true);
  });

  it("HexGame reports connection-win and not line/draw", () => {
    const game = new HexGame({ size: 4 });
    const c = game.concepts?.();
    assert.ok(c);
    assert.equal(c.has("ConnectionWin"), true);
    assert.equal(c.has("LineWin"), false);
    assert.equal(c.has("DrawByFill"), false);
  });

  it("smaller boards still expose concepts (no context needed)", () => {
    const game = new FlatBoardGame({
      id: "tiny",
      name: "Tiny",
      width: 2,
      height: 2,
      numPlayers: 2,
      lineLength: 2,
    });
    const c = game.concepts?.();
    assert.ok(c);
    assert.ok(c.size > 0);
  });
});

describe("Game records state history during play", () => {
  it("start populates previousStates with the initial-state hash", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    assert.equal(ctx.trial.previousStates.length, 1);
    assert.equal(ctx.trial.previousStates[0], ctx.state.hash());
  });

  it("apply appends the post-move state hash to previousStates", () => {
    const game = ticTacToeGame();
    const ctx0 = game.start();
    const move = game.moves(ctx0)[0];
    assert.ok(move);
    const ctx1 = game.apply(ctx0, move);
    assert.equal(ctx1.trial.previousStates.length, 2);
    assert.equal(ctx1.trial.previousStates[1], ctx1.state.hash());
  });

  it("hashes change as moves are played (no spurious repetition)", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    const seen = new Set<number>();
    for (const h of ctx.trial.previousStates) seen.add(h);
    while (!ctx.over && ctx.trial.numMoves < 5) {
      const move = game.moves(ctx)[0];
      if (!move) break;
      ctx = game.apply(ctx, move);
      const latest = ctx.trial.previousStates.at(-1);
      assert.ok(latest !== undefined);
      assert.equal(seen.has(latest), false);
      seen.add(latest);
    }
  });
});
