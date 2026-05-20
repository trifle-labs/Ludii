import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Context, compileLudemeSource } from "../src/index.js";

// Default-store ("Outer") two-row mancala. Java indexes a left store at cell 0,
// shifting the playing holes up by one; track literals carry that offset and
// the engine translates them back onto its 0-based playing-hole lattice. The
// two stores are appended after the board, mapped to each player via
// (map {(pair P1 FirstSite) (pair P2 LastSite)}).
const DAS_BOHNENSPIEL = `
(define "PiecesOwnedBy" (+ (count at:(mapEntry #1)) (count in:(sites #1))))
(game "Das Bohnenspiel"
    (players 2)
    (equipment {
        (mancalaBoard 2 6 (track "Track" "1,E,N,W" loop:True))
        (regions "Home" P1 (sites Bottom))
        (regions "Home" P2 (sites Top))
        (map {(pair P1 FirstSite) (pair P2 LastSite)})
        (piece "Seed" Shared)
    })
    (rules
        (start (set Count 6 to:(sites Track)))
        (play
            (move Select
                (from (sites Mover) if:(> (count at:(from)) 0))
                (then
                    (sow
                        if:(is In (count at:(to)) (sites {2 4 6}))
                        apply:(fromTo
                            (from (to))
                            (to (mapEntry (mover)))
                            count:(count at:(to))
                        )
                        backtracking:True
                    )
                )
            )
        )
        (end ("MancalaByScoreWhen" (no Moves Mover)))
    )
)`;

const seedTotal = (ctx: Context): number => {
  let t = 0;
  for (let i = 0; i < ctx.state.cells.length; i += 1) t += ctx.state.countAtSite(i);
  return t;
};

describe("LudemeGame: default-store mancala (map / mapEntry / sow)", () => {
  it("seeds all 12 playing holes with 6 each (track offset applied)", () => {
    const game = compileLudemeSource(DAS_BOHNENSPIEL);
    const ctx = game.start();
    // 12 playing holes + 2 store cells.
    assert.equal(ctx.state.cells.length, 14, "12 holes + 2 stores");
    for (let i = 0; i < 12; i += 1) {
      assert.equal(ctx.state.countAtSite(i), 6, `hole ${i} seeded with 6`);
    }
    assert.equal(ctx.state.countAtSite(12), 0, "left store starts empty");
    assert.equal(ctx.state.countAtSite(13), 0, "right store starts empty");
    assert.equal(seedTotal(ctx), 72, "72 seeds total at start");
  });

  it("offers one Select move per non-empty home hole of the mover", () => {
    const game = compileLudemeSource(DAS_BOHNENSPIEL);
    const ctx = game.start();
    const moves = game.moves(ctx);
    // P1 home = bottom row = holes 0..5, all non-empty.
    assert.equal(moves.length, 6, "six pickup moves");
    const froms = moves.map((m) => m.from()).sort((a, b) => a - b);
    assert.deepEqual(froms, [0, 1, 2, 3, 4, 5]);
  });

  it("conserves all seeds and reaches a scored terminal state", () => {
    const game = compileLudemeSource(DAS_BOHNENSPIEL);
    let ctx = game.start();
    let rng = 12345;
    const rand = (): number =>
      (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let n = 0;
    while (!game.over(ctx) && n < 500) {
      const moves = game.moves(ctx);
      if (moves.length === 0) break;
      const m = moves[Math.floor(rand() * moves.length)];
      assert.ok(m);
      ctx = game.apply(ctx, m);
      assert.equal(seedTotal(ctx), 72, `seeds conserved after move ${n + 1}`);
      n += 1;
    }
    assert.equal(game.over(ctx), true, "game terminates");
    assert.ok(ctx.winner >= 0, "winner resolved (0 = draw, else a player)");
  });

  it("sends a capturing player's seeds into their mapped store", () => {
    const game = compileLudemeSource(DAS_BOHNENSPIEL);
    let ctx = game.start();
    let rng = 999;
    const rand = (): number =>
      (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let n = 0;
    while (!game.over(ctx) && n < 500) {
      const moves = game.moves(ctx);
      if (moves.length === 0) break;
      const m = moves[Math.floor(rand() * moves.length)];
      assert.ok(m);
      ctx = game.apply(ctx, m);
      n += 1;
    }
    const stored = ctx.state.countAtSite(12) + ctx.state.countAtSite(13);
    assert.ok(stored > 0, "captures accumulated in the stores");
  });
});
