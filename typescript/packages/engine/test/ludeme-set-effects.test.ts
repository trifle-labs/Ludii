import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(set …)` covers a family of state-mutating effects. These are pervasive in
// chess (set Count / set State for castling/en-passant flags) and mancala
// (set Count to seed holes). The compiler must accept each sub-keyword and the
// applied actions must hit the right state layer.
function game(effect: string): string {
  return `
(game "SetEffects"
    (players 2)
    (equipment {
        (board (rectangle 1 3))
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {0}))
            (place "Disc2" (sites {2}))
        })
        (play (move Add (to (sites {1})) (then ${effect})))
        (end (if (= (count Pieces P1) 9) (result P1 Win)))
    )
)`;
}

function applyCentreAdd(src: string) {
  const compiled = compileLudemeSource(src);
  const ctx = compiled.start();
  const move = compiled.moves(ctx).find((m) => m.to() === 1);
  assert.ok(move, "the Add move onto the empty centre exists");
  return compiled.apply(ctx, move);
}

describe("LudemeGame: (set …) effects", () => {
  it("(set Count <n> at:<site>) writes the per-site count layer", () => {
    const next = applyCentreAdd(game(`(set Count 5 at:0)`));
    assert.equal(next.state.countAtSite(0), 5, "count layer updated");
  });

  it("(set State at:<site> <n>) writes the per-site state layer", () => {
    const next = applyCentreAdd(game(`(set State at:0 2)`));
    assert.equal(next.state.stateAtSite(0), 2, "state layer updated");
  });

  it("(set Value <player> <n>) writes the per-player value", () => {
    const next = applyCentreAdd(game(`(set Value Mover 7)`));
    assert.equal(next.state.valuePlayer(1), 7, "player value updated");
  });

  it("(set Value at:<site> <n>) writes the per-site value layer", () => {
    const next = applyCentreAdd(game(`(set Value at:0 4)`));
    assert.equal(next.state.valueAtSite(0), 4, "site value updated");
  });

  it("(set Counter <n>) writes the game counter, then auto-increments", () => {
    // Java parity: ActionSetCounter sets the counter during the move, then
    // Game.java:3142 `incrCounter()` runs once after the end rules — so the
    // saved state reads n + 1 (9 → 10), not n.
    const next = applyCentreAdd(game(`(set Counter 9)`));
    assert.equal(next.state.counter, 10, "counter set to 9, then incremented");
  });

  it("(set RememberValue …) and (set Hidden …) compile as no-op-safe", () => {
    assert.doesNotThrow(() =>
      compileLudemeSource(game(`(set RememberValue "Seen" 3)`)),
    );
    assert.doesNotThrow(() =>
      compileLudemeSource(game(`(set Hidden at:0 (player 2))`)),
    );
  });

  it("(set Count <n> to:<region>) seeds every site of a region", () => {
    const next = applyCentreAdd(game(`(set Count 3 to:(sites {0 2}))`));
    assert.equal(next.state.countAtSite(0), 3, "region site 0 seeded");
    assert.equal(next.state.countAtSite(2), 3, "region site 2 seeded");
  });
});
