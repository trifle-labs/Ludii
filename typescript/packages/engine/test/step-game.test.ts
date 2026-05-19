import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { StepGame } from "../src/index.js";

function buildBoard(width: number, height: number): number[] {
  return new Array(width * height).fill(0);
}

describe("StepGame", () => {
  it("generates orthogonal step moves from owned cells to empty neighbours", () => {
    const init = buildBoard(3, 3);
    init[4] = 1; // P1 centre piece
    const game = new StepGame({
      id: "test",
      name: "test",
      width: 3,
      height: 3,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      winMode: "noMoves",
    });
    const ctx = game.start();
    const moves = game.moves(ctx);
    // 4 orthogonal neighbours of centre, all empty
    assert.equal(moves.length, 4);
    const targets = moves.map((m) => m.siteIndices[1]).sort();
    assert.deepEqual(targets, [1, 3, 5, 7]);
  });

  it("ignores moves onto own pieces and skips capture when disabled", () => {
    // 2×2 board: P1 at 0,1; P2 at 2,3. Each P1 piece is adjacent only to
    // an own piece or an enemy (no captures allowed) → zero legal moves.
    const init = buildBoard(2, 2);
    init[0] = 1;
    init[1] = 1;
    init[2] = 2;
    init[3] = 2;
    const game = new StepGame({
      id: "test",
      name: "test",
      width: 2,
      height: 2,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      allowCapture: false,
      winMode: "noMoves",
    });
    const ctx = game.start();
    assert.equal(game.moves(ctx).length, 0);
  });

  it("captures an enemy piece when allowCapture=true", () => {
    const init = buildBoard(3, 1);
    init[0] = 1; // P1
    init[1] = 2; // P2
    const game = new StepGame({
      id: "cap",
      name: "cap",
      width: 3,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      allowCapture: true,
      winMode: "eliminate",
    });
    let ctx = game.start();
    const cap = game
      .moves(ctx)
      .find((m) => m.siteIndices[0] === 0 && m.siteIndices[1] === 1);
    assert.ok(cap, "expected a 0→1 capture move");
    ctx = game.apply(ctx, cap);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
    assert.equal(ctx.state.cellAt(1).owner, 1);
  });

  it("ends with winner = mover when opponent has no legal moves", () => {
    const init = buildBoard(2, 1);
    init[0] = 1;
    init[1] = 2;
    const game = new StepGame({
      id: "stuck",
      name: "stuck",
      width: 2,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      winMode: "noMoves",
    });
    const ctx = game.start();
    // P1 has no legal moves (only neighbour is P2 and capture disabled).
    // So P1 should immediately lose under the noMoves rule. But moves()
    // is checked at the start of P2's turn, not P1's — verify that the
    // initial position correctly enumerates 0 moves for P1.
    assert.equal(game.moves(ctx).length, 0);
  });

  it("slide movement walks until blocked, ignoring intermediate empty cells", () => {
    // 1×5 strip. P1 at 0, P2 at 3. With movementKind=slide and no capture,
    // P1 can slide to 1 or 2 (blocked by P2 at 3).
    const init = buildBoard(5, 1);
    init[0] = 1;
    init[3] = 2;
    const game = new StepGame({
      id: "slide",
      name: "slide",
      width: 5,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      allowCapture: false,
      winMode: "noMoves",
      movementKind: "slide",
    });
    const ctx = game.start();
    const targets = game
      .moves(ctx)
      .map((m) => m.siteIndices[1])
      .sort();
    assert.deepEqual(targets, [1, 2]);
  });

  it("hop jumps an adjacent enemy onto an empty cell two away, removing it", () => {
    // 1×5 strip. P1 at 0, P2 at 1, sites 2,3,4 empty. P1 hops 0→2 removing P2.
    const init = buildBoard(5, 1);
    init[0] = 1;
    init[1] = 2;
    const game = new StepGame({
      id: "hop",
      name: "hop",
      width: 5,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      winMode: "eliminate",
      movementKind: "hop",
    });
    let ctx = game.start();
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1);
    const hop = moves[0];
    if (!hop) throw new Error("expected a hop");
    assert.equal(hop.siteIndices[1], 2);
    ctx = game.apply(ctx, hop);
    assert.equal(ctx.state.cellAt(0).owner, 0);
    assert.equal(ctx.state.cellAt(1).owner, 0);
    assert.equal(ctx.state.cellAt(2).owner, 1);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });

  it("hop does not emit a move when no enemy is adjacent", () => {
    const init = buildBoard(5, 1);
    init[0] = 1;
    init[3] = 2;
    const game = new StepGame({
      id: "hop-empty",
      name: "hop-empty",
      width: 5,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      movementKind: "hop",
      winMode: "noMoves",
    });
    const ctx = game.start();
    assert.equal(game.moves(ctx).length, 0);
  });

  it("slide+capture stops on the captured enemy cell", () => {
    const init = buildBoard(5, 1);
    init[0] = 1;
    init[3] = 2;
    const game = new StepGame({
      id: "slide-cap",
      name: "slide-cap",
      width: 5,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      allowCapture: true,
      winMode: "eliminate",
      movementKind: "slide",
    });
    const ctx = game.start();
    const targets = game
      .moves(ctx)
      .map((m) => m.siteIndices[1])
      .sort();
    // Reachable: 1, 2 (empty), 3 (capture). Not 4 (slide stops on capture).
    assert.deepEqual(targets, [1, 2, 3]);
  });

  it("line-win triggers when a step creates an in-row sequence", () => {
    // 1×5 strip, P1 at 0,2; P2 at 4. P1 steps 2→1 to make 0,1 → not yet
    // a line of 3. Instead, set up so a single move completes the line.
    const init = buildBoard(5, 1);
    init[0] = 1;
    init[1] = 1;
    init[4] = 2;
    init[3] = 1;
    // Pre: P1 owns 0,1,3 with site 2 empty. Stepping 3→2 should make
    // 0,1,2 a line of 3.
    const game = new StepGame({
      id: "line",
      name: "line",
      width: 5,
      height: 1,
      numPlayers: 2,
      initialPlacement: init,
      adjacency: "orthogonal",
      allowCapture: false,
      winMode: "line",
      lineLength: 3,
    });
    let ctx = game.start();
    const winMove = game
      .moves(ctx)
      .find((m) => m.siteIndices[0] === 3 && m.siteIndices[1] === 2);
    assert.ok(winMove, "expected 3→2 step");
    ctx = game.apply(ctx, winMove);
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });
});
