import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compileLudemeSource,
  HEX_TILING,
  hexagonMask,
  InterpBoard,
  triangleMask,
  triHexagonMask,
} from "../src/index.js";

// Coverage for the grammar batch added from the move/bool/int specs (no new
// State/Action infra): (priority …), (forEach Site/Value …), (move Leap …),
// (is Full …), (all Sites …), (id <role>), (state at:), (var …), and the
// new (count …) variants. Site index = row*W + col, origin (site 0) = A1.

describe("LudemeGame: (priority {…})", () => {
  const PRIORITY = (place: string): string => `
(game "PriorityProbe"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        ${place}
        (play (priority {
            (move Remove (sites Occupied by:Mover))
            (move Add (to (sites Empty)))
        }))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

  it("returns the first non-empty generator and skips the rest", () => {
    const game = compileLudemeSource(PRIORITY(`(start (place "Disc1" {"B2"}))`));
    const moves = game.moves(game.start());
    assert.equal(moves.length, 1, "only the removal, not the 8 adds");
    assert.equal(moves[0]?.to(), 4, "removes the mover's piece at B2");
  });

  it("falls through to a later generator when earlier ones are empty", () => {
    const game = compileLudemeSource(PRIORITY(""));
    const moves = game.moves(game.start());
    assert.equal(moves.length, 9, "no owned piece → the 9 empty-cell adds");
  });
});

describe("LudemeGame: (forEach Site …) and (forEach Value …)", () => {
  it("(forEach Site <region> (move Add (to (site)))) adds at each site", () => {
    const src = `
(game "ForEachSite"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (forEach Site (sites Empty) (move Add (to (site)))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    const tos = game
      .moves(game.start())
      .map((m) => m.to())
      .sort((a, b) => a - b);
    assert.deepEqual(tos, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("(forEach Value min: max: …) repeats the inner generator per value", () => {
    const src = `
(game "ForEachValue"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (forEach Value min:1 max:3 (move Add (to (sites Empty)))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    // 9 empty cells × 3 values = 27 generated moves.
    assert.equal(game.moves(game.start()).length, 27);
  });
});

describe("LudemeGame: (move Leap <walk> …)", () => {
  it("a KnightWalk leaps to the 8 knight destinations", () => {
    const src = `
(game "LeapProbe"
    (players 2)
    (equipment {
        (board (square 5))
        (piece "Knight" Each
            (move Leap { {F F R F} {F F L F} } (to if:(is Empty (to)))))
    })
    (rules
        (start (place "Knight1" {"C3"}))
        (play (forEach Piece))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    const moves = game.moves(game.start());
    const tos = moves.map((m) => m.to()).sort((a, b) => a - b);
    // Knight at C3 (site 12, centre of 5x5).
    assert.deepEqual(tos, [1, 3, 5, 9, 15, 19, 21, 23], "8 knight jumps");
    assert.ok(moves.every((m) => m.from() === 12), "all originate at C3");
  });
});

describe("LudemeGame: (is Full) and (all Sites …)", () => {
  it("(is Full) becomes true once the last cell is filled", () => {
    const src = `
(game "FullProbe"
    (players 2)
    (equipment { (board (square 1)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Full) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true, "board now full");
    assert.equal(next.winner, 1);
  });

  it("(all Sites <region> if:(is Occupied (to))) holds when all are filled", () => {
    const src = `
(game "AllSitesProbe"
    (players 2)
    (equipment { (board (square 1)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (all Sites (sites Board) if:(is Occupied (to)))
                 (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });
});

describe("LudemeGame: (do <moves> ifAfterwards:<bool>)", () => {
  it("filters out moves whose resulting position fails the predicate", () => {
    // A lone Disc1 at B2 (site 4) may relocate to any empty cell, but the
    // ifAfterwards guard forbids any move that leaves site 0 (A1) occupied —
    // i.e. the relocation onto A1 is illegal, the other seven are legal.
    const src = `
(game "DoFilter"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (start (place "Disc1" {"B2"}))
        (play (do (move (to (sites Empty)))
                  ifAfterwards:(not (is Occupied 0))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    const tos = game
      .moves(game.start())
      .map((m) => m.to())
      .sort((a, b) => a - b);
    assert.deepEqual(tos, [1, 2, 3, 5, 6, 7, 8], "A1 destination filtered out");
  });
});

describe("LudemeGame: (apply (if …)) conditional effects", () => {
  it("removes a target only when the if-condition holds", () => {
    // P1's lone Disc relocates to an empty cell; its (apply (if …)) clears
    // the enemy at C3 (site 8) because that cell is occupied.
    const src = `
(game "ApplyIf"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (start { (place "Disc1" {"A1"}) (place "Disc2" {"C3"}) })
        (play (move (from (sites Occupied by:Mover))
                    (to (sites Empty)
                        (apply (if (is Occupied 8) (remove 8))))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const move = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(move, "a relocation A1→B1 exists");
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[8], 0, "enemy at C3 removed by the if-effect");
    assert.equal(next.state.cells[1], 1, "mover relocated to B1");
    assert.equal(next.state.cells[0], 0, "origin A1 emptied");
  });
});

describe("LudemeGame: (no Pieces …) and (no Moves …)", () => {
  it("(no Pieces Next) wins once the opponent is captured out", () => {
    const src = `
(game "NoPiecesProbe"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (start { (place "Disc1" {"A1"}) (place "Disc2" {"A2"}) })
        (play (move (from (sites Occupied by:Mover))
                    (to (sites Around (from) Orthogonal) if:("IsEnemyAt" (to))
                        (apply (remove (to))))))
        (end (if (no Pieces Next) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1, "P2 has no pieces left");
  });

  it("(no Moves Next) wins when the opponent is left without a move", () => {
    const src = `
(game "NoMovesProbe"
    (players 2)
    (equipment { (board (square 1)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (no Moves Next) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1, "the full board leaves Next no move");
  });
});

describe("LudemeGame: (id <role>), (var …), (count …) variants", () => {
  function probeEnd(predicate: string, then = ""): string {
    return `
(game "IntProbe"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty)) ${then}))
        (end (if ${predicate} (result Mover Win)))
    )
)`;
  }

  function winsAfterFirstMove(src: string): boolean {
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    return next.over && next.winner === 1;
  }

  it("(id Next) resolves to the player after the mover", () => {
    assert.ok(winsAfterFirstMove(probeEnd("(= (id Next) 2)")));
  });

  it("(var \"n\") reads a variable written by (then (set Var …))", () => {
    assert.ok(
      winsAfterFirstMove(probeEnd('(= (var "n") 5)', '(then (set Var "n" 5))')),
    );
  });

  it("(count Rows) and (count Columns) report the board dimensions", () => {
    assert.ok(winsAfterFirstMove(probeEnd("(= (count Rows) 3)")));
    assert.ok(winsAfterFirstMove(probeEnd("(= (count Columns) 3)")));
  });

  it("(count Turns) is floor(moves / players)", () => {
    // One move made, two players → floor(1/2) = 0.
    assert.ok(winsAfterFirstMove(probeEnd("(= (count Turns) 0)")));
  });

  it("(state at:0) reads a site's local state (0 by default)", () => {
    assert.ok(winsAfterFirstMove(probeEnd("(= (state at:0) 0)")));
  });

  it("(id \"Name\" Mover) resolves to the mover's player id", () => {
    // The piece name is structurally present but the value tracks the
    // role's player id (cells store owner ids in the TS engine).
    assert.ok(winsAfterFirstMove(probeEnd('(= (id "Disc" Mover) 1)')));
    assert.ok(winsAfterFirstMove(probeEnd('(= (id "Disc" Next) 2)')));
  });
});

describe("LudemeGame: hand containers", () => {
  // A 3×3 board with one hand site per player. P1's disc starts in hand and
  // can be dropped onto any empty board cell. handSite(P1) = 9, handSite(P2)
  // = 10 (board sites 0–8, hands appended after).
  const HAND = `
(game "HandDrop"
    (players 2)
    (equipment { (board (square 3)) (hand Each) (piece "Disc" Each) })
    (rules
        (start (place "Disc1" (handSite P1)))
        (play (move (from (handSite Mover)) (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

  it("(handSite Mover) drops a hand piece onto every empty board cell", () => {
    const game = compileLudemeSource(HAND);
    const moves = game.moves(game.start());
    const tos = moves.map((m) => m.to()).sort((a, b) => a - b);
    assert.deepEqual(tos, [0, 1, 2, 3, 4, 5, 6, 7, 8], "9 empty board drops");
    assert.ok(moves.every((m) => m.from() === 9), "all originate at P1's hand");
  });

  it("applying a drop empties the hand site and fills the board cell", () => {
    const game = compileLudemeSource(HAND);
    const ctx = game.start();
    assert.equal(ctx.state.cells[9], 1, "P1's disc starts in hand site 9");
    const move = game.moves(ctx).find((m) => m.to() === 4);
    assert.ok(move, "a drop onto B2 (site 4) exists");
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[4], 1, "disc now on the board");
    assert.equal(next.state.cells[9], 0, "hand site emptied");
  });

  it("(sites Empty) covers only board cells, never hand sites", () => {
    const game = compileLudemeSource(HAND);
    // The hand site (9) is occupied at start, but even an empty hand site
    // must not appear among (sites Empty) — it returned 9 board drops above,
    // not 10, which already proves the hand is excluded.
    const moves = game.moves(game.start());
    assert.equal(moves.length, 9);
  });
});

describe("LudemeGame: redundant parens and bare-curly move sets", () => {
  it("unwraps double-parenthesised predicates like ((= …))", () => {
    const src = `
(game "ParenProbe"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if ((= (id Next) 2)) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("attaches a trailing (then …) sibling to every (or …) alternative", () => {
    // The (then …) is a sibling of the move generators, not a generator
    // itself; its consequence must fold into the moves the (or …) produces.
    const src = `
(game "OrThen"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (or
            (move Add (to (sites Empty)))
            (then (set Var "n" 7))
        ))
        (end (if (= (var "n") 7) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    assert.equal(game.moves(ctx).length, 9, "9 adds, the (then …) is no gen");
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true, "the then-consequence set n=7");
    assert.equal(next.winner, 1);
  });

  it("treats a bare { … } move block as an implicit (or …)", () => {
    const src = `
(game "CurlyMoves"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play { (move Add (to (sites Empty))) })
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    assert.equal(game.moves(game.start()).length, 9);
  });
});

describe("LudemeGame: hex board topology", () => {
  it("hexagonMask(side) has 3·s²−3·s+1 on-board cells", () => {
    for (const [side, cells] of [
      [1, 1],
      [2, 7],
      [3, 19],
      [5, 61],
    ] as const) {
      const m = hexagonMask(side);
      assert.equal(m.width, 2 * side - 1);
      assert.equal(m.height, 2 * side - 1);
      const onCount = (m.onBoard ?? []).filter(Boolean).length;
      assert.equal(onCount, cells, `hexagon side ${side}`);
    }
  });

  it("a hex cell has six edge-neighbours, not eight", () => {
    // 3×3 rhombus of hexes; centre is site (1,1) = index 4.
    const board = new InterpBoard(3, 3, [], [], HEX_TILING);
    const cx = board.xOf(4);
    const cy = board.yOf(4);
    const neigh = new Set<number>();
    for (const d of Object.values(HEX_TILING.absolute)) {
      const s = board.siteAt(cx + d.dx, cy + d.dy);
      if (s >= 0) neigh.add(s);
    }
    // The two acute corners of the rhombus (0 and 8) are NOT adjacent.
    assert.deepEqual(
      [...neigh].sort((a, b) => a - b),
      [1, 2, 3, 5, 6, 7],
    );
  });

  it("(hex n) compiles to a hexagonal board with the right cell count", () => {
    const src = `
(game "HexFill"
    (players 2)
    (equipment { (board (hex 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    // Side-3 hexagon = 19 cells, all empty at start.
    assert.equal(game.moves(game.start()).length, 19);
  });

  it("(hex w h) compiles to a fully-filled rhombus of hexes", () => {
    const src = `
(game "HexRhombus"
    (players 2)
    (equipment { (board (hex 3 4)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    assert.equal(game.moves(game.start()).length, 12);
  });

  it("(hex Hexagon n) named shape matches (hex n)", () => {
    const src = `
(game "HexNamed"
    (players 2)
    (equipment { (board (hex Hexagon 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    assert.equal(game.moves(game.start()).length, 19);
  });
});

describe("LudemeGame: triangular board topology", () => {
  it("triangleMask(n) has n(n+1)/2 on-board cells", () => {
    for (const [n, cells] of [
      [1, 1],
      [2, 3],
      [3, 6],
      [5, 15],
    ] as const) {
      const m = triangleMask(n);
      assert.equal(m.width, n);
      assert.equal(m.height, n);
      assert.equal((m.onBoard ?? []).filter(Boolean).length, cells);
    }
  });

  it("triHexagonMask(n) has 3n²−3n+1 on-board cells", () => {
    for (const [n, cells] of [
      [2, 7],
      [3, 19],
      [4, 37],
    ] as const) {
      const m = triHexagonMask(n);
      assert.equal((m.onBoard ?? []).filter(Boolean).length, cells);
    }
  });

  it("(tri n) compiles to a triangular board with the right cell count", () => {
    const src = `
(game "TriFill"
    (players 2)
    (equipment { (board (tri 4)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    // Side-4 triangle = 4·5/2 = 10 cells.
    assert.equal(game.moves(game.start()).length, 10);
  });

  it("(tri Hexagon n) compiles to a hexagonal tri board", () => {
    const src = `
(game "TriHex"
    (players 2)
    (equipment { (board (tri Hexagon 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
    const game = compileLudemeSource(src);
    assert.equal(game.moves(game.start()).length, 19);
  });
});

describe("LudemeGame: dice subsystem", () => {
  const ROLLER = (dice: string): string => `
(game "Roller"
    (players 2)
    (equipment { (board (square 3)) ${dice} (piece "Disc" Each) })
    (rules
        (play (roll))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

  it("(dice d:6 num:2) starts with two zeroed dice", () => {
    const game = compileLudemeSource(ROLLER("(dice d:6 num:2)"));
    assert.deepEqual([...game.start().state.diceValues], [0, 0]);
  });

  it("num: sizes the dice array", () => {
    const game = compileLudemeSource(ROLLER("(dice d:2 from:0 num:4)"));
    assert.equal(game.start().state.diceValues.length, 4);
  });

  it("(roll) draws a face from each die's range", () => {
    const game = compileLudemeSource(ROLLER("(dice d:6 num:2)"));
    const ctx = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1);
    const rolled = game.apply(ctx, moves[0]!).state.diceValues;
    assert.equal(rolled.length, 2);
    for (const v of rolled) assert.ok(v >= 1 && v <= 6, `die ${v} in 1..6`);
  });

  it("(roll) respects from: so d:2 from:0 yields 0 or 1", () => {
    const game = compileLudemeSource(ROLLER("(dice d:2 from:0 num:3)"));
    const ctx = game.start();
    const rolled = game.apply(ctx, game.moves(ctx)[0]!).state.diceValues;
    for (const v of rolled) assert.ok(v === 0 || v === 1, `die ${v} in {0,1}`);
  });

  it("facesByDie: gives each die its own face set", () => {
    const game = compileLudemeSource(
      ROLLER("(dice facesByDie:{{1 2 3 4} {0 1}} num:2)"),
    );
    const ctx = game.start();
    assert.equal(ctx.state.diceValues.length, 2);
    const rolled = game.apply(ctx, game.moves(ctx)[0]!).state.diceValues;
    assert.ok([1, 2, 3, 4].includes(rolled[0]!), `die0 ${rolled[0]}`);
    assert.ok([0, 1].includes(rolled[1]!), `die1 ${rolled[1]}`);
  });
});
