import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { compileLudSource, LudCompileError } from "../src/index.js";

const TIC_TAC_TOE_LUD = `
(game "Tic-Tac-Toe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" P1)
        (piece "Cross" P2)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))
    )
)
`;

describe("compileLudSource", () => {
  it("builds a FlatBoardGame from a tic-tac-toe .lud string", () => {
    const game = compileLudSource(TIC_TAC_TOE_LUD);
    assert.equal(game.width, 3);
    assert.equal(game.height, 3);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.lineLength, 3);
    assert.equal(game.name, "Tic-Tac-Toe");
    assert.deepEqual([...game.componentLabels], ["Disc", "Cross"]);
  });

  it("plays the compiled game to a P1 win", () => {
    const game = compileLudSource(TIC_TAC_TOE_LUD);
    let ctx = game.start();
    for (const site of [0, 3, 1, 4, 2]) {
      const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
      assert.ok(move, `expected legal move at site ${site}`);
      ctx = game.apply(ctx, move);
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("compiles the corpus 'Tic-Tac-Toe Renamed.lud'", () => {
    const path = "Common/res/lud/test/Tic-Tac-Toe Renamed.lud";
    const absolute = new URL(`../../../../../${path}`, import.meta.url);
    const source = readFileSync(absolute, "utf8");
    const game = compileLudSource(source);
    assert.equal(game.width, 3);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.lineLength, 3);
  });

  it("throws LudCompileError when the (players N) clause is missing", () => {
    const bad =
      '(game "X" (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) }) (rules (end (if (is Line 3) (result Mover Win)))))';
    assert.throws(() => compileLudSource(bad), LudCompileError);
  });

  it("throws when the board is not a square", () => {
    const bad = `(game "X" (players 2) (equipment { (board (hex 3)) (piece "D" P1) (piece "C" P2) }) (rules (end (if (is Line 3) (result Mover Win)))))`;
    assert.throws(() => compileLudSource(bad), LudCompileError);
  });

  it("falls back to the board size when no Line K rule is present", () => {
    const noLine = `(game "X" (players 2) (equipment { (board (square 4)) (piece "D" P1) (piece "C" P2) }) (rules (end (if (no Moves Next) (result Mover Win)))))`;
    const game = compileLudSource(noLine);
    assert.equal(game.lineLength, 4);
  });
});
