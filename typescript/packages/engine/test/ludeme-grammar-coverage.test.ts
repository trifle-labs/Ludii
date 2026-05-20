import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource } from "../src/index.js";

// Probe games for the grammar features added alongside the turn model:
// the `(sites …)` vocabulary, `(move Pass)` / `(move Remove …)`, the
// generalised `(then …)` effect pipeline, `(is Prev/Next …)`, and the
// `(if <bool> <a> <b>)` value/predicate selector. Site index = row*W + col,
// origin (site 0) = bottom-left (A1).

function regionProbe(region: string): string {
  return `
(game "RegionProbe"
    (players 2)
    (equipment { (board (square 3)) })
    (rules
        (play (move Add (to ${region})))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;
}

function sortedTos(src: string): number[] {
  const game = compileLudemeSource(src);
  return game
    .moves(game.start())
    .map((m) => m.to())
    .sort((a, b) => a - b);
}

describe("LudemeGame: expanded (sites …) vocabulary", () => {
  it("(sites Centre) is the single middle cell of a 3x3", () => {
    assert.deepEqual(sortedTos(regionProbe("(sites Centre)")), [4]);
  });

  it("(sites Corners) are the four corners", () => {
    assert.deepEqual(sortedTos(regionProbe("(sites Corners)")), [0, 2, 6, 8]);
  });

  it("(sites Outer) is the perimeter ring", () => {
    assert.deepEqual(
      sortedTos(regionProbe("(sites Outer)")),
      [0, 1, 2, 3, 5, 6, 7, 8],
    );
  });

  it("(sites Row n) selects a whole row", () => {
    assert.deepEqual(sortedTos(regionProbe("(sites Row 1)")), [3, 4, 5]);
  });

  it("(sites Around s) is all 8 neighbours by default", () => {
    assert.deepEqual(
      sortedTos(regionProbe("(sites Around 4)")),
      [0, 1, 2, 3, 5, 6, 7, 8],
    );
  });

  it("(sites Around s Orthogonal) is the 4 edge neighbours", () => {
    assert.deepEqual(
      sortedTos(regionProbe("(sites Around 4 Orthogonal)")),
      [1, 3, 5, 7],
    );
  });
});

const REMOVE = `
(game "RemoveProbe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" Each)
    })
    (rules
        (start { (place "Disc1" {"A1" "B1"}) (place "Disc2" {"C3"}) })
        (play (move Remove (sites Occupied by:Enemy)))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

describe("LudemeGame: (sites Occupied by:role) + (move Remove)", () => {
  it("by:Enemy scopes to the opponent's pieces", () => {
    const game = compileLudemeSource(REMOVE);
    const ctx = game.start();
    assert.equal(ctx.state.cells[0], 1, "Disc1 A1");
    assert.equal(ctx.state.cells[1], 1, "Disc1 B1");
    assert.equal(ctx.state.cells[8], 2, "Disc2 C3");
    const tos = game.moves(ctx).map((m) => m.to());
    assert.deepEqual(tos, [8], "P1 may remove only the enemy at C3");
  });

  it("applying the removal clears that cell", () => {
    const game = compileLudemeSource(REMOVE);
    const ctx = game.start();
    const move = game.moves(ctx)[0];
    assert.ok(move);
    const next = game.apply(ctx, move);
    assert.equal(next.state.cells[8], 0, "C3 emptied");
    assert.equal(next.state.cells[0], 1, "own pieces untouched");
  });
});

const PASS = `
(game "PassProbe"
    (players 2)
    (equipment { (board (square 2)) })
    (rules
        (play (move Pass))
        (end (if (>= (count Moves) 2) (result Mover Draw)))
    )
)`;

describe("LudemeGame: (move Pass)", () => {
  it("offers a single pass that skips the turn", () => {
    const game = compileLudemeSource(PASS);
    let ctx: Context = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1);
    assert.equal(moves[0]?.isPass(), true);
    ctx = game.apply(ctx, moves[0] as never);
    assert.equal(ctx.mover, 2, "turn passed");
    assert.equal(ctx.over, false);
    ctx = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(ctx.over, true, "two passes end the game");
    assert.equal(ctx.winner, 0);
  });
});

const SCORE = `
(game "ScoreProbe"
    (players 2)
    (equipment { (board (square 3)) })
    (rules
        (play (move Add (to (sites Empty)) (then (addScore Mover 5))))
        (end (if (= 1 0) (result Mover Draw)))
    )
)`;

describe("LudemeGame: (then …) effect pipeline", () => {
  it("(then (addScore Mover 5)) adds to the mover's score", () => {
    const game = compileLudemeSource(SCORE);
    const ctx = game.start();
    assert.equal(ctx.state.score(1), 0, "score starts at 0");
    const move = game.moves(ctx)[0];
    assert.ok(move);
    const next = game.apply(ctx, move);
    assert.equal(next.state.score(1), 5, "score incremented by 5");
  });
});

describe("LudemeGame: (if <bool> <a> <b>) value/predicate selector", () => {
  // After P1's opening move, (count Moves) is 1 (odd), so (is Even …) is
  // false and each ternary selects its else-branch.
  it("int ternary: a false (is Even …) picks the else value", () => {
    const src = `
(game "TernaryInt"
    (players 2)
    (equipment { (board (square 3)) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (= 2 (if (is Even (count Moves)) 1 2)) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1, "else value 2 satisfied the win test");
  });

  it("bool ternary: a false (is Even …) picks the else predicate", () => {
    const src = `
(game "TernaryBool"
    (players 2)
    (equipment { (board (square 3)) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (if (is Even (count Moves)) (= 1 0) (= 1 1)) (result Mover Win)))
    )
)`;
    const game = compileLudemeSource(src);
    const ctx = game.start();
    const next = game.apply(ctx, game.moves(ctx)[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1, "else predicate (= 1 1) won");
  });
});

describe("LudemeGame: (is Next/Prev role)", () => {
  // Three players so next (P2) and prev (P3) of the P1 mover differ.
  const probe = (predicate: string): string => `
(game "RoleProbe"
    (players 3)
    (equipment { (board (square 3)) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if ${predicate} (result Mover Win)))
    )
)`;

  it("(is Next 2) holds for the player after the P1 mover", () => {
    const game = compileLudemeSource(probe("(is Next 2)"));
    const next = game.apply(game.start(), game.moves(game.start())[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("(is Next 3) is false (P3 is prev, not next)", () => {
    const game = compileLudemeSource(probe("(is Next 3)"));
    const next = game.apply(game.start(), game.moves(game.start())[0] as never);
    assert.equal(next.over, false, "no win: P3 is not the next player");
  });

  it("(is Prev 1) holds for the player who just moved (Ludii state.prev)", () => {
    // Java parity (Game.java: state.setPrev(mover)): `Prev` is the player who
    // made the previous move, not the cyclic predecessor of the mover. After
    // P1's move the previous mover is P1, so `(is Prev 1)` holds — and this is
    // what the `"SameTurn"` idiom `(is Prev Mover)` relies on across a
    // `(moveAgain)` continuation.
    const game = compileLudemeSource(probe("(is Prev 1)"));
    const next = game.apply(game.start(), game.moves(game.start())[0] as never);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("(is Prev 3) is false (P3 did not make the previous move)", () => {
    const game = compileLudemeSource(probe("(is Prev 3)"));
    const next = game.apply(game.start(), game.moves(game.start())[0] as never);
    assert.equal(next.over, false, "no win: P3 is not the previous mover");
  });
});
