import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compileLudemeSource,
  HEX_TILING,
  SQUARE_TILING,
  hexagonMask,
} from "../src/index.js";

// Hex-grid topology: a pointy-topped hex board has six neighbours, and
// direction resolution goes through the HEX_TILING table.

describe("Tilings: SQUARE_TILING", () => {
  it("has 8 absolute directions", () => {
    assert.equal(Object.keys(SQUARE_TILING.absolute).length, 8);
  });

  it("has All = 8 directions", () => {
    assert.equal(SQUARE_TILING.groups.All?.length, 8);
  });

  it("has Orthogonal = 4 directions", () => {
    assert.equal(SQUARE_TILING.groups.Orthogonal?.length, 4);
  });

  it("has Diagonal = 4 directions", () => {
    assert.equal(SQUARE_TILING.groups.Diagonal?.length, 4);
  });
});

describe("Tilings: HEX_TILING", () => {
  it("has 6 absolute directions (E/W/NE/NW/SE/SW)", () => {
    assert.equal(Object.keys(HEX_TILING.absolute).length, 6);
  });

  it("has no N or S absolute directions", () => {
    assert.ok(!HEX_TILING.absolute.N);
    assert.ok(!HEX_TILING.absolute.S);
  });

  it("groups collapse Orthogonal/Diagonal/Adjacent/All to the same 6", () => {
    assert.equal(HEX_TILING.groups.Orthogonal?.length, 6);
    assert.equal(HEX_TILING.groups.Diagonal?.length, 6);
    assert.equal(HEX_TILING.groups.Adjacent?.length, 6);
    assert.equal(HEX_TILING.groups.All?.length, 6);
  });
});

describe("Hex board parsing", () => {
  it("parses (board (hex 2 3)) as a rhombus of hexes", () => {
    const src = `
(game "HexRhombus"
    (players 2)
    (equipment { (board (hex 2 3)) })
    (rules (play (move Pass)) (end (if (= 1 0) (result Mover Draw))))
)`;
    const game = compileLudemeSource(src);
    // 2×3 rhombus → 6 cells, no mask.
    assert.equal(game.numSites, 6);
  });

  it("parses (board (hexagon 3)) with the hex-mask bounding box", () => {
    const src = `
(game "Hexagon"
    (players 2)
    (equipment { (board (hexagon 3)) })
    (rules (play (move Pass)) (end (if (= 1 0) (result Mover Draw))))
)`;
    const game = compileLudemeSource(src);
    // Hexagon of side 3 → span 5×5, but only 19 real cells (3·3²−3·3+1).
    const mask = hexagonMask(3);
    assert.equal(game.numSites, mask.width * mask.height);
    assert.equal(mask.width, 5);
    assert.equal(mask.height, 5);
  });
});

describe("Hex topology: (sites Around) follows hex neighbours", () => {
  it("(sites Around <site>) on hex rhombus returns 6 neighbours", () => {
    // A 3×3 hex rhombus: the centre has all 6 neighbours inside the board.
    const src = `
(game "HexAround"
    (players 2)
    (equipment { (board (hex 3 3)) })
    (rules
        (play (move Add (to (sites Around 4))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    const moves = game
      .moves(game.start())
      .map((m) => m.to())
      .sort((a, b) => a - b);
    assert.equal(moves.length, 6, "a hex centre has 6 neighbours");
  });
});
