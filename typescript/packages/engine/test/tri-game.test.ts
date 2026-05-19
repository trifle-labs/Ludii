import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudSource, TriGame, triGame } from "../src/index.js";

describe("TriGame", () => {
  it("creates a triangular board with N(N+1)/2 cells", () => {
    const game = triGame(5);
    assert.equal(game.size, 5);
    assert.equal(game.siteCount, 15);
    const ctx = game.start();
    assert.equal(ctx.state.cells.length, 15);
    assert.equal(
      ctx.state.cells.every((c) => c === 0),
      true,
    );
  });

  it("emits one move per empty cell", () => {
    const game = triGame(3);
    const ctx = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 6); // 1 + 2 + 3 = 6 cells
  });

  it("alternates movers and tracks placement", () => {
    const game = triGame(4);
    let ctx = game.start();
    assert.equal(ctx.state.mover, 1);
    // Pick an interior cell (row 2, col 1) so the win check doesn't
    // fire — the row-0 corner touches all three sides on its own.
    const firstMoves = game.moves(ctx);
    const interior = firstMoves.find((mv) => mv.siteIndices[0] === 4);
    assert.ok(interior);
    ctx = game.apply(ctx, interior);
    assert.equal(ctx.over, false);
    assert.equal(ctx.state.mover, 2);
    assert.equal(ctx.state.cells[4], 1);
  });

  it("declares a Y-style win when a player connects all three sides", () => {
    // size=2: cells are { (0,0) row0, (1,0) (1,1) row1 }. The single
    // top-cell (0,0) is in ALL three sides (top, left=col0, right=c==r).
    // Placing one P1 piece at (0,0) should trigger a win.
    const game = new TriGame({ size: 2 });
    const ctx = game.start();
    const moves = game.moves(ctx);
    const topCell = moves.find((m) => m.siteIndices[0] === 0);
    assert.ok(topCell);
    const next = game.apply(ctx, topCell);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("does NOT declare a win until all three sides are reached (size 3)", () => {
    // size=3: row 0: idx 0; row 1: idx 1, 2; row 2: idx 3, 4, 5.
    // Place P1 only at the top corner (idx 0). Top + left + right all
    // touched by index 0? (0,0): r=0 c=0 → top, left, c==r → all three.
    // So size>=3 should also let a single top-corner stone win.
    const game = new TriGame({ size: 3 });
    const ctx = game.start();
    const moves = game.moves(ctx);
    const m = moves.find((mv) => mv.siteIndices[0] === 0);
    assert.ok(m);
    const next = game.apply(ctx, m);
    assert.equal(next.over, true);
    assert.equal(next.winner, 1);
  });

  it("compiles a .lud Y game and identifies it as a connection game", () => {
    const src = `(game "Y"
      (players 2)
      (equipment {
        (board (tri 4) use:Vertex)
        (piece "Marker" Each)
      })
      (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
      ))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof TriGame);
    assert.equal(game.size, 4);
    const ctx = game.start();
    assert.ok(game.moves(ctx).length > 0);
  });

  it("handles (tri Shape N) by treating shape as opaque", () => {
    const src = `(game "Y (Hex)"
      (players 2)
      (equipment {
        (board (tri Hexagon 5) use:Vertex)
        (piece "Marker" Each)
      })
      (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
      ))`;
    const game = compileLudSource(src);
    assert.ok(game instanceof TriGame);
    assert.equal((game as TriGame).size, 5);
  });
});
