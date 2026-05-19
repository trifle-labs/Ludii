import assert from "node:assert/strict";
import test from "node:test";

import { TicTacToeGame } from "../src/index.js";

test("TicTacToeGame alternates players until someone wins", () => {
  const game = new TicTacToeGame();

  assert.equal(game.play(0), true);
  assert.equal(game.play(3), true);
  assert.equal(game.play(1), true);
  assert.equal(game.play(4), true);
  assert.equal(game.play(2), true);

  const state = game.getState();

  assert.equal(state.outcome, "X");
  assert.equal(state.currentPlayer, "X");
  assert.deepEqual(game.getLegalMoves(), []);
});

test("TicTacToeGame detects draws", () => {
  const game = new TicTacToeGame();
  const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];

  for (const move of moves) {
    assert.equal(game.play(move), true);
  }

  assert.equal(game.getState().outcome, "draw");
});

test("TicTacToeGame rejects moves into occupied cells", () => {
  const game = new TicTacToeGame();

  assert.equal(game.play(0), true);
  assert.equal(game.play(0), false);
});
