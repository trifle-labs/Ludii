import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type Context,
  FlatBoardGame,
  Move,
  State,
  Trial,
  ticTacToeGame,
} from "../src/index.js";

function findMoveAtSite(
  game: FlatBoardGame,
  context: Context,
  site: number,
): Move {
  const move = game.moves(context).find((m) => m.siteIndices[0] === site);
  if (!move) {
    throw new Error(`No legal move targets site ${site}.`);
  }
  return move;
}

describe("FlatBoardGame: tic-tac-toe", () => {
  it("starts on a fresh empty board with mover = 1", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    assert.equal(ctx.state.siteCount, 9);
    assert.equal(ctx.mover, 1);
    assert.equal(ctx.over, false);
    assert.equal(ctx.winner, -1);
    for (let i = 0; i < ctx.state.siteCount; i += 1) {
      assert.equal(ctx.state.cellAt(i).owner, 0);
    }
  });

  it("enumerates 9 legal moves on an empty 3x3 board", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    assert.equal(game.moves(ctx).length, 9);
  });

  it("alternates movers after each apply", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    assert.equal(ctx.mover, 1);
    ctx = game.apply(ctx, findMoveAtSite(game, ctx, 0));
    assert.equal(ctx.mover, 2);
    ctx = game.apply(ctx, findMoveAtSite(game, ctx, 1));
    assert.equal(ctx.mover, 1);
  });

  it("declares the placing mover as winner when a row completes", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // Sites: X at 0, O at 3, X at 1, O at 4, X at 2 → X wins top row.
    const sequence = [0, 3, 1, 4, 2];
    for (const site of sequence) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
    assert.equal(game.moves(ctx).length, 0);
  });

  it("detects diagonal wins", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // X 0, O 1, X 4, O 2, X 8 → diagonal 0,4,8 wins
    for (const site of [0, 1, 4, 2, 8]) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("reports a draw when the board fills with no line", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // Standard drawn sequence.
    const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const site of sequence) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 0);
  });

  it("records every move in trial order", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 3, 1, 4, 2]) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    assert.equal(ctx.trial.numMoves, 5);
    assert.deepEqual(
      ctx.trial.moves.map((m) => m.siteIndices[0]),
      [0, 3, 1, 4, 2],
    );
  });

  it("throws when applying a move to a terminal context", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    for (const site of [0, 3, 1, 4, 2]) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    const dummy = new Move({
      id: "x",
      label: "x",
      siteIndices: [5],
      mover: 2,
      placedOwner: 2,
    });
    assert.throws(() => game.apply(ctx, dummy));
  });

  it("rejects a move whose mover does not match the state mover", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const wrong = new Move({
      id: "y",
      label: "y",
      siteIndices: [0],
      mover: 2,
      placedOwner: 2,
    });
    assert.throws(() => game.apply(ctx, wrong));
  });

  it("rejects a move targeting an occupied site", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    ctx = game.apply(ctx, findMoveAtSite(game, ctx, 0));
    const overlap = new Move({
      id: "z",
      label: "z",
      siteIndices: [0],
      mover: 2,
      placedOwner: 2,
    });
    assert.throws(() => game.apply(ctx, overlap));
  });

  it("returns frozen cell arrays in State", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    assert.throws(() => {
      (ctx.state.cells as number[])[0] = 9;
    });
  });
});

describe("FlatBoardGame: configurable shapes", () => {
  it("supports 4-in-a-row on a 5x4 grid", () => {
    const game = new FlatBoardGame({
      id: "test",
      name: "Test",
      width: 5,
      height: 4,
      numPlayers: 2,
      lineLength: 4,
    });
    let ctx = game.start();
    // P1 plays sites 0,1,2,3 (top row); P2 plays 5,6,7
    for (const site of [0, 5, 1, 6, 2, 7, 3]) {
      ctx = game.apply(ctx, findMoveAtSite(game, ctx, site));
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("default labels fall back when not supplied", () => {
    const game = new FlatBoardGame({
      id: "t",
      name: "T",
      width: 3,
      height: 3,
      numPlayers: 2,
      lineLength: 3,
    });
    assert.equal(game.componentLabels.length, 2);
  });

  it("State construction validates mover", () => {
    assert.throws(() => new State(0, [0, 0], ["X"]));
  });

  it("Trial construction validates non-terminal winner", () => {
    assert.throws(() => new Trial([], false, 1));
  });
});
