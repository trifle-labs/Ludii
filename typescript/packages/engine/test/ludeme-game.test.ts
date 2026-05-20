import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type Context,
  compileLudemeSource,
  type FlatBoardGame,
  type Game,
  type Move,
  ticTacToeGame,
} from "../src/index.js";

// The real Common/res/lud/board/space/line/Tic-Tac-Toe.lud, inlined so the
// test is self-contained and also exercises the `("Line3Win")` builtin
// define expansion path.
const TIC_TAC_TOE = `
(game "Tic-Tac-Toe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "Disc" P1)
        (piece "Cross" P2)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end ("Line3Win"))
    )
)
`;

function moveAtSite(game: Game, ctx: Context, site: number): Move {
  const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
  if (!move) throw new Error(`No legal move targets site ${site}.`);
  return move;
}

function playSites(game: Game, sites: readonly number[]): Context {
  let ctx = game.start();
  for (const site of sites) {
    ctx = game.apply(ctx, moveAtSite(game, ctx, site));
  }
  return ctx;
}

describe("LudemeGame: interprets Tic-Tac-Toe", () => {
  it("starts empty with mover 1 and 9 legal moves", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = game.start();
    assert.equal(game.numSites, 9);
    assert.equal(ctx.mover, 1);
    assert.equal(ctx.over, false);
    assert.equal(game.moves(ctx).length, 9);
  });

  it("alternates movers", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    let ctx = game.start();
    assert.equal(ctx.mover, 1);
    ctx = game.apply(ctx, moveAtSite(game, ctx, 0));
    assert.equal(ctx.mover, 2);
    ctx = game.apply(ctx, moveAtSite(game, ctx, 1));
    assert.equal(ctx.mover, 1);
  });

  it("declares the placing mover the winner on a completed row", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = playSites(game, [0, 3, 1, 4, 2]);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
    assert.equal(game.moves(ctx).length, 0);
  });

  it("detects a diagonal win", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = playSites(game, [0, 1, 4, 2, 8]);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("reports a draw when the board fills with no line", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = playSites(game, [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 0);
  });

  it("records every move in trial order", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = playSites(game, [0, 3, 1, 4, 2]);
    assert.equal(ctx.trial.numMoves, 5);
    assert.deepEqual(
      ctx.trial.moves.map((m) => m.siteIndices[0]),
      [0, 3, 1, 4, 2],
    );
  });

  it("throws when applying to a terminal context", () => {
    const game = compileLudemeSource(TIC_TAC_TOE);
    const ctx = playSites(game, [0, 3, 1, 4, 2]);
    const dummy = game.start();
    const aMove = game.moves(dummy)[0];
    assert.ok(aMove);
    assert.throws(() => game.apply(ctx, aMove));
  });
});

describe("LudemeGame: parity with FlatBoardGame", () => {
  const sequences: number[][] = [
    [0, 3, 1, 4, 2], // P1 top row
    [0, 1, 4, 2, 8], // P1 diagonal
    [0, 1, 2, 4, 3, 5, 7, 6, 8], // draw
    [4, 0, 8, 6, 2], // P1 anti-diagonal
  ];

  for (const seq of sequences) {
    it(`matches FlatBoardGame for [${seq.join(",")}]`, () => {
      const interp = compileLudemeSource(TIC_TAC_TOE);
      const template: FlatBoardGame = ticTacToeGame();
      let ictx = interp.start();
      let tctx = template.start();
      for (const site of seq) {
        if (tctx.over) break;
        ictx = interp.apply(ictx, moveAtSite(interp, ictx, site));
        tctx = template.apply(tctx, moveAtSite(template, tctx, site));
        assert.deepEqual(
          ictx.state.cells,
          tctx.state.cells,
          `cells diverged after site ${site}`,
        );
        assert.equal(ictx.over, tctx.over, `over diverged after ${site}`);
        assert.equal(ictx.winner, tctx.winner, `winner diverged after ${site}`);
        assert.equal(ictx.mover, tctx.mover, `mover diverged after ${site}`);
      }
    });
  }
});
