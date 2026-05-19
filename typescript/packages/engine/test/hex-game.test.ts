import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, HexGame, hexGame, Move } from "../src/index.js";

function siteAt(size: number, x: number, y: number): number {
  return y * size + x;
}

function applyAt(game: HexGame, ctx: Context, x: number, y: number): Context {
  const site = siteAt(game.size, x, y);
  const move = game.moves(ctx).find((m) => m.siteIndices[0] === site);
  if (!move) {
    throw new Error(`No legal move at (${x}, ${y}).`);
  }
  return game.apply(ctx, move);
}

describe("HexGame", () => {
  it("starts on an empty NxN board with P1 to move", () => {
    const game = hexGame(5);
    const ctx = game.start();
    assert.equal(ctx.state.siteCount, 25);
    assert.equal(ctx.mover, 1);
    assert.equal(ctx.over, false);
  });

  it("rejects size < 2", () => {
    assert.throws(() => new HexGame({ size: 1 }));
  });

  it("P1 wins by connecting top to bottom on a small board", () => {
    const game = hexGame(3);
    let ctx = game.start();
    // P1 plays a straight column at x=0: (0,0), (0,1), (0,2)
    // P2 fills with non-blocking cells: (2,0), (2,1)
    // After P1 plays (0,2) the chain (0,0)-(0,1)-(0,2) connects top to bottom.
    ctx = applyAt(game, ctx, 0, 0); // P1
    ctx = applyAt(game, ctx, 2, 0); // P2
    ctx = applyAt(game, ctx, 0, 1); // P1
    ctx = applyAt(game, ctx, 2, 1); // P2
    ctx = applyAt(game, ctx, 0, 2); // P1
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("P2 wins by connecting left to right on a small board", () => {
    const game = hexGame(3);
    let ctx = game.start();
    // P1 plays sites that don't form a top-bottom chain. P2 builds a row at y=0:
    // P1: (1,1); P2: (0,0); P1: (1,2); P2: (1,0); P1: (2,2); P2: (2,0)
    ctx = applyAt(game, ctx, 1, 1); // P1
    ctx = applyAt(game, ctx, 0, 0); // P2
    ctx = applyAt(game, ctx, 1, 2); // P1
    ctx = applyAt(game, ctx, 1, 0); // P2
    ctx = applyAt(game, ctx, 2, 2); // P1
    ctx = applyAt(game, ctx, 2, 0); // P2 — completes left-right
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 2);
  });

  it("does not declare a winner before a chain completes", () => {
    const game = hexGame(3);
    let ctx = game.start();
    ctx = applyAt(game, ctx, 0, 0);
    ctx = applyAt(game, ctx, 2, 0);
    assert.equal(ctx.over, false);
    assert.equal(ctx.winner, -1);
  });

  it("recognises diagonal-neighbour links via the rhombic neighbourhood", () => {
    // The two diagonal neighbours in axial coords for (1,0) are
    // (2,-1) and (0,1). Only (0,1) is on a 3x3 board. So (1,0)-(0,1)
    // forms a hex link. Build a P2 left→right chain that crosses the
    // rhombic diagonal.
    const game = hexGame(3);
    let ctx = game.start();
    // P1: (1,1) (won't form a chain)
    ctx = applyAt(game, ctx, 1, 1);
    // P2: (0,2) → adjacent (0,2)-(1,1)? Actually we want left-right.
    // Easier: P2 builds y=1: (0,1)-(1,1)-(2,1). But (1,1) is P1's.
    // Instead show diagonal jump on row y=0->y=1 then y=2.
    // P2: (0,1); P1: (0,0); P2: (1,1) — taken. Just use straight row.
    // Test goal: cover that HEX_NEIGHBOURS[4]/[5] direction yields a
    // valid neighbour. Build (0,1)-(1,0) link explicitly.
    ctx = applyAt(game, ctx, 0, 1); // P2 at left edge
    ctx = applyAt(game, ctx, 2, 2); // P1 unrelated
    ctx = applyAt(game, ctx, 1, 0); // P2 — diagonal link (0,1)-(1,0)
    ctx = applyAt(game, ctx, 0, 2); // P1 unrelated
    ctx = applyAt(game, ctx, 2, 0); // P2 — (1,0)-(2,0) hex link to right edge
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 2);
  });

  it("emits stable, unique move ids per legal move", () => {
    const game = hexGame(3);
    const ctx = game.start();
    const moves = game.moves(ctx);
    const ids = new Set(moves.map((m) => m.id));
    assert.equal(ids.size, moves.length);
  });

  it("rejects a move targeting an occupied site", () => {
    const game = hexGame(3);
    let ctx = game.start();
    ctx = applyAt(game, ctx, 0, 0);
    const overlap = new Move({
      id: "x",
      label: "x",
      siteIndices: [0],
      mover: 2,
      placedOwner: 2,
    });
    assert.throws(() => game.apply(ctx, overlap));
  });
});
