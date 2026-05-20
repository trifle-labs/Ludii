import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// Placing on the centre cell (site 1 of a 1x3 row) grants another turn via a
// conditional `(moveAgain)` effect, and sets a pending marker the continuation
// turn can read with `(is Pending)`.
const REPLAY = `
(game "Replay"
    (players 2)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" Each)
    })
    (rules
        (play
            (move Add
                (to (sites Empty))
                (then
                    (if (= (last To) 1)
                        (and (moveAgain) (set Pending))
                    )
                )
            )
        )
        (end (if (no Moves Mover) (result Mover Draw)))
    )
)`;

describe("LudemeGame: conditional (moveAgain) effect + (is Pending)", () => {
  it("keeps the same mover after a move that triggers (moveAgain)", () => {
    const game = compileLudemeSource(REPLAY);
    const ctx = game.start();
    assert.equal(ctx.mover, 1);
    const toCentre = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(toCentre, "a move onto the centre exists");
    const next = game.apply(ctx, toCentre);
    assert.equal(next.mover, 1, "mover plays again");
    assert.equal(next.state.pending.size > 0, true, "pending marker set");
  });

  it("rotates the mover after a move that does not trigger (moveAgain)", () => {
    const game = compileLudemeSource(REPLAY);
    const ctx = game.start();
    const toEdge = game.moves(ctx).find((m) => m.to() === 0);
    assert.ok(toEdge, "a move onto an edge exists");
    const next = game.apply(ctx, toEdge);
    assert.equal(next.mover, 2, "turn passes to the next player");
    assert.equal(next.state.pending.size, 0, "no pending marker");
  });

  it("clears a previous turn's pending marker on the next apply", () => {
    const game = compileLudemeSource(REPLAY);
    const ctx = game.start();
    // P1 plays centre → moveAgain + pending; P1 plays an edge → pending clears.
    const centre = game.moves(ctx).find((m) => m.to() === 1);
    assert.ok(centre);
    const c1 = game.apply(ctx, centre);
    assert.equal(c1.state.pending.size > 0, true);
    const edge = game.moves(c1).find((m) => m.to() === 0);
    assert.ok(edge);
    const c2 = game.apply(c1, edge);
    assert.equal(c2.state.pending.size, 0, "pending cleared after non-setting move");
    assert.equal(c2.mover, 2, "and the turn finally passes");
  });
});
