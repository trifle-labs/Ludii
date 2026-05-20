import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// A 1x3 row with a P1 piece at site 0. The relocation move prefixes both the
// from- and to-clauses with the `Cell` graph-element type — a token the engine
// parses and discards. The piece may move from site 0 to either empty site.
const CELL_PREFIX = `
(game "CellPrefix"
    (players 1)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {0})))
        (play (move (from Cell (sites Occupied)) (to Cell (sites Empty))))
        (end (if (is Full) (result Mover Win)))
    )
)`;

// A 1x3 row with a P1 piece at site 1. `(move Remove 1)` uses a bare integer
// where a region is expected; it must be promoted to the single-site region
// {1}, yielding exactly one removal move targeting site 1.
const BARE_NUMBER = `
(game "BareNumber"
    (players 1)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" P1)
    })
    (rules
        (start (place "Disc1" (sites {1})))
        (play (move Remove 1))
        (end (if (= (count Pieces Mover) 0) (result Mover Win)))
    )
)`;

describe("LudemeGame: SiteType-prefixed from/to clauses", () => {
  it("parses (from Cell …)/(to Cell …) and relocates the piece", () => {
    const game = compileLudemeSource(CELL_PREFIX);
    const ctx = game.start();
    const moves = game.moves(ctx);
    const froms = new Set(moves.map((m) => m.from()));
    const tos = new Set(moves.map((m) => m.to()));
    assert.deepEqual([...froms], [0], "the only occupied source is site 0");
    assert.deepEqual([...tos].sort((a, b) => a - b), [1, 2], "to the empties");
  });
});

describe("LudemeGame: bare-integer region", () => {
  it("promotes a bare integer to a single-site region", () => {
    const game = compileLudemeSource(BARE_NUMBER);
    const ctx = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1, "exactly one removal move");
    assert.equal(moves[0]?.to(), 1, "targets site 1");
  });
});
