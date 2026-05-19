import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  compileLudSource,
  FlatBoardGame,
  HexGame,
  LudCompileError,
} from "../src/index.js";

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

const HEX_LUD = `
(game "Hex"
    (players 2)
    (equipment {
        (board (hex Diamond 5))
        (piece "Marker" Each)
        (regions P1 {(sites Side NE) (sites Side SW) })
        (regions P2 {(sites Side NW) (sites Side SE) })
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
    )
)
`;

describe("compileLudSource", () => {
  it("builds a FlatBoardGame from a tic-tac-toe .lud string", () => {
    const game = compileLudSource(TIC_TAC_TOE_LUD);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.width, 3);
    assert.equal(game.height, 3);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.lineLength, 3);
    assert.equal(game.name, "Tic-Tac-Toe");
    assert.deepEqual([...game.componentLabels], ["Disc", "Cross"]);
  });

  it("plays the compiled tic-tac-toe game to a P1 win", () => {
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
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.width, 3);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.lineLength, 3);
  });

  it("builds a HexGame from a (board (hex Diamond N)) .lud string", () => {
    const game = compileLudSource(HEX_LUD);
    assert.ok(game instanceof HexGame);
    assert.equal(game.width, 5);
    assert.equal(game.height, 5);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.name, "Hex");
    assert.deepEqual([...game.componentLabels], ["Marker", "Marker"]);
  });

  it("plays the compiled Hex game to a P1 win", () => {
    const game = compileLudSource(
      `(game "Hex" (players 2)
         (equipment { (board (hex Diamond 3)) (piece "Marker" Each) })
         (rules
           (play (move Add (to (sites Empty))))
           (end (if (is Connected Mover) (result Mover Win)))))`,
    );
    let ctx = game.start();
    // P1 column win at x=0: (0,0) site=0, (0,1) site=3, (0,2) site=6.
    // P2 fillers at x=2.
    const sequence = [0, 2, 3, 5, 6];
    for (const site of sequence) {
      const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
      assert.ok(move, `expected legal move at site ${site}`);
      ctx = game.apply(ctx, move);
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("throws LudCompileError when the (players N) clause is missing", () => {
    const bad =
      '(game "X" (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) }) (rules (end (if (is Line 3) (result Mover Win)))))';
    assert.throws(() => compileLudSource(bad), LudCompileError);
  });

  it("throws when a hex board has no connection win rule", () => {
    const bad = `(game "X" (players 2)
      (equipment { (board (hex Diamond 3)) (piece "M" Each) })
      (rules (end (if (is Line 3) (result Mover Win)))))`;
    assert.throws(() => compileLudSource(bad), LudCompileError);
  });

  it("throws when an unsupported board shape is used", () => {
    const bad = `(game "X" (players 2)
      (equipment { (board (triangle 3)) (piece "D" P1) (piece "C" P2) })
      (rules (end (if (is Line 3) (result Mover Win)))))`;
    assert.throws(() => compileLudSource(bad), LudCompileError);
  });

  it("falls back to the board size when no Line K rule is present", () => {
    const noLine = `(game "X" (players 2) (equipment { (board (square 4)) (piece "D" P1) (piece "C" P2) }) (rules (end (if (no Moves Next) (result Mover Win)))))`;
    const game = compileLudSource(noLine);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.lineLength, 4);
  });

  it("builds a FlatBoardGame from a (board (rectangle H W)) .lud string", () => {
    const src = `(game "Rect4x3"
      (players 2)
      (equipment {
        (board (rectangle 3 4))
        (piece "D" P1) (piece "C" P2)
      })
      (rules (play (move Add (to (sites Empty)))) (end (if (is Line 3) (result Mover Win)))))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.width, 4);
    assert.equal(game.height, 3);
    assert.equal(game.lineLength, 3);
  });

  it("recognises curly-brace (end { (if ...) (if ...) }) blocks", () => {
    const src = `(game "TTT"
      (players 2)
      (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) })
      (rules
        (play (move Add (to (sites Empty))))
        (end {
          (if (no Moves Next) (result Mover Draw))
          (if (is Line 3) (result Mover Win))
        })))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.lineLength, 3);
  });

  it("compiles a (start (place ...)) clause into initial cells", () => {
    const src = `(game "X" (players 2)
      (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) })
      (rules
        (start { (place "D" P1 (sites {0 4})) (place "C" P2 (sites {8})) })
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))))`;
    const game = compileLudSource(src);
    const ctx = game.start();
    assert.equal(ctx.state.cellAt(0).owner, 1);
    assert.equal(ctx.state.cellAt(4).owner, 1);
    assert.equal(ctx.state.cellAt(8).owner, 2);
    assert.equal(ctx.state.cellAt(1).owner, 0);
  });

  it("compiles (start (set Mover P2)) to start with player 2", () => {
    const src = `(game "X" (players 2)
      (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) })
      (rules
        (start (set Mover P2))
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))))`;
    const game = compileLudSource(src);
    assert.equal(game.start().state.mover, 2);
  });

  it("recognises (is Line K) buried inside (or { ... }) wrappers", () => {
    const src = `(game "X" (players 2)
      (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) })
      (rules
        (play (move Add (to (sites Empty))))
        (end (if (or { (is Line 3) (no Moves Next) }) (result Mover Win)))))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.lineLength, 3);
  });

  it("defaults the rectangular line length to the shorter side", () => {
    const src = `(game "X" (players 2)
      (equipment { (board (rectangle 2 5)) (piece "D" P1) (piece "C" P2) })
      (rules (end (if (no Moves Next) (result Mover Draw)))))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.width, 5);
    assert.equal(game.height, 2);
    assert.equal(game.lineLength, 2);
  });
});
