import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FlatBoardGame,
  GameLoader,
  HexGame,
  LudCompileError,
} from "../src/index.js";

const TTT = `
(game "Tic-Tac-Toe"
    (players 2)
    (equipment { (board (square 3)) (piece "D" P1) (piece "C" P2) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))
    )
)
`;

const HEX = `
(game "Hex"
    (players 2)
    (equipment { (board (hex Diamond 3)) (piece "M" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
    )
)
`;

describe("GameLoader", () => {
  it("loadFromSource compiles a .lud string into a Game", () => {
    const loader = new GameLoader();
    const game = loader.loadFromSource(TTT);
    assert.ok(game instanceof FlatBoardGame);
    assert.equal(game.numSites, 9);
  });

  it("register + load resolves by canonical name", () => {
    const loader = new GameLoader();
    loader.register("ttt", TTT);
    loader.register("hex", HEX);
    assert.deepEqual([...loader.list()].sort(), ["hex", "ttt"]);
    assert.ok(loader.load("ttt") instanceof FlatBoardGame);
    assert.ok(loader.load("hex") instanceof HexGame);
  });

  it("load throws LudCompileError for unknown names", () => {
    const loader = new GameLoader();
    assert.throws(() => loader.load("missing"), LudCompileError);
  });

  it("register rejects an empty name", () => {
    const loader = new GameLoader();
    assert.throws(() => loader.register("", TTT));
  });
});
