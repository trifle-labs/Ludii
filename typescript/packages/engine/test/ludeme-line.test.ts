import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource, type Context, type Game } from "../src/index.js";

// Faithful (is Line …) coverage. Java IsLine pivots on the last-placed site
// (LastTo) by default and walks it bidirectionally along each radial + its
// opposite, counting one contiguous run THROUGH the pivot — it does not scan
// every owned cell. `exact:True` requires that maximal run to equal `len`
// exactly (a longer run does not satisfy a shorter exact length).
//
// All games below are "place a piece on any empty cell" on a 5×5 board so a
// scripted move sequence can build precise line shapes. Cell ids are row-major
// from the bottom-left: row 1 (A1..E1) = 0..4, row 2 (A2..E2) = 5..9.

const lineGame = (endCond: string): string => `
(game "LineProbe"
    (players 2)
    (equipment {
        (board (square 5))
        (piece "Disc" Each)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if ${endCond} (result Mover Win)))
    )
)`;

// Apply the legal move that places on cell `to`. Fails loudly if absent so a
// behavioural change (e.g. an unexpected early win ending the game) surfaces.
const placeAt = (game: Game, ctx: Context, to: number): Context => {
  const move = game.moves(ctx).find((m) => m.to() === to && !m.isPass());
  assert.ok(move, `expected a legal placement on cell ${to}`);
  return game.apply(ctx, move);
};

// Build two separated horizontal X segments {A1,B1} and {D1,E1}, then join them
// with C1 — so the contiguous run through the just-placed C1 jumps 2 → 5 and
// never passes through an exact length of 3 or 4. Returns the final context.
// X = P1 plays row-1 cells; O = P2 fills row-2 cells so the runs stay one-row.
const playJoinSequence = (game: Game): Context => {
  let ctx = game.start();
  // (X, O) pairs leading to the join at C1 (cell 2) on X's fifth move.
  const script: Array<[number, number]> = [
    [0, 5], // A1 / A2
    [1, 6], // B1 / B2
    [3, 8], // D1 / D2
    [4, 9], // E1 / E2
  ];
  for (const [x, o] of script) {
    if (game.over(ctx)) return ctx;
    ctx = placeAt(game, ctx, x);
    if (game.over(ctx)) return ctx;
    ctx = placeAt(game, ctx, o);
  }
  if (game.over(ctx)) return ctx;
  return placeAt(game, ctx, 2); // C1 joins A1..E1 into a run of five
};

describe("LudemeGame: faithful (is Line …) semantics", () => {
  it("a non-exact line wins as soon as the joined run reaches the length", () => {
    const game = compileLudemeSource(lineGame("(is Line 3)"));
    const ctx = playJoinSequence(game);
    assert.equal(game.over(ctx), true, "(is Line 3) fires on the run of five");
    assert.equal(ctx.winner, 1, "P1 (mover who placed C1) wins");
  });

  it("exact:True matching the run length wins on the join", () => {
    const game = compileLudemeSource(lineGame("(is Line 5 exact:True)"));
    const ctx = playJoinSequence(game);
    assert.equal(game.over(ctx), true, "exact:5 matches the run of exactly five");
    assert.equal(ctx.winner, 1, "P1 wins");
  });

  it("exact:True does NOT match a run longer than the length", () => {
    // The run through C1 is five long; exact:3 must reject it. Crucially the
    // run never passes through an exact length of three earlier (it is 2, then
    // jumps to 5), so the game must still be live with no winner.
    const game = compileLudemeSource(lineGame("(is Line 3 exact:True)"));
    const ctx = playJoinSequence(game);
    assert.equal(game.over(ctx), false, "exact:3 rejects the run of five");
    assert.equal(ctx.winner, -1, "no winner — the join is too long for exact:3");
  });

  it("an ordinary 3-in-a-row wins on the completing (last) placement", () => {
    // Build A1,B1 then C1; the win must trigger only when C1 — the LastTo
    // pivot — completes the contiguous run, not before.
    const game = compileLudemeSource(lineGame("(is Line 3)"));
    let ctx = game.start();
    ctx = placeAt(game, ctx, 0); // X A1
    ctx = placeAt(game, ctx, 5); // O A2
    ctx = placeAt(game, ctx, 1); // X B1
    assert.equal(game.over(ctx), false, "two in a row is not a line of three");
    ctx = placeAt(game, ctx, 6); // O B2
    ctx = placeAt(game, ctx, 2); // X C1 completes A1-B1-C1
    assert.equal(game.over(ctx), true, "the completing placement wins");
    assert.equal(ctx.winner, 1, "P1 wins");
  });
});
