import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// Coverage for region/int ludemes added for chess/connection/puzzle families:
// (regionSite …)/(max …)/(min …) ints, (sites State/Group/To/Playable)
// regions, (array …)/(where …) regions, and the (is Active …)/(is Solved)
// bool guards. The apply-based cases write into an observable state layer via a
// (then (set Counter …)) effect on a single Add move; the rest pin compilation.
function game(effect: string): string {
  return `
(game "RegionIntExtra"
    (players 2)
    (equipment {
        (board (rectangle 1 9))
        (piece "Disc" Each)
    })
    (rules
        (start { (place "Disc1" (sites {0})) (place "Disc2" (sites {8})) })
        (play (move Add (to (sites {4})) (then ${effect})))
        (end (if (= (count Pieces P1) 99) (result P1 Win)))
    )
)`;
}

function applyCentre(src: string) {
  const compiled = compileLudemeSource(src);
  const ctx = compiled.start();
  const move = compiled.moves(ctx).find((m) => m.to() === 4);
  assert.ok(move, "the Add move onto site 4 exists");
  return compiled.apply(ctx, move);
}

describe("LudemeGame: (regionSite …)/(max …)/(min …) ints", () => {
  // Probe the resolved int via `set Value` (not `set Counter`): the automatic
  // per-move counter increment (Java Counter.java) would off-by-one a counter
  // probe, whereas the per-player value layer is untouched by it.
  it("(regionSite <region> index:<n>) reads the nth site", () => {
    const next = applyCentre(game(`(set Value Mover (regionSite (sites {3 5 7}) index:1))`));
    assert.equal(next.state.valuePlayer(1), 5, "index 1 of {3 5 7} is 5");
  });

  it("(max <region>) is the largest site index", () => {
    const next = applyCentre(game(`(set Value Mover (max (sites {3 5 7})))`));
    assert.equal(next.state.valuePlayer(1), 7);
  });

  it("(min <region>) is the smallest site index", () => {
    const next = applyCentre(game(`(set Value Mover (min (sites {3 5 7})))`));
    assert.equal(next.state.valuePlayer(1), 3);
  });
});

describe("LudemeGame: region/bool grammar coverage", () => {
  const compiles = (label: string, src: string) =>
    assert.doesNotThrow(() => compileLudemeSource(src), label);

  it("(sites State <n>), (sites Group at:…), (sites To/From/Playable) compile", () => {
    compiles("sites State", game(`(set Counter (size Array (sites State 1)))`));
    compiles(
      "sites Group",
      game(`(set Counter (size Array (sites Group at:(last To))))`),
    );
    compiles("sites To", game(`(set Counter (size Array (sites To)))`));
    compiles("sites From", game(`(set Counter (size Array (sites From)))`));
    compiles(
      "sites Playable",
      game(`(set Counter (size Array (sites Playable)))`),
    );
  });

  it("(array {…}) and (where \"Piece\" <role>) compile as regions", () => {
    compiles("array", game(`(set Counter (size Array (array {1 2 3})))`));
    compiles(
      "where",
      game(`(set Counter (size Array (where "Disc" Mover)))`),
    );
  });

  it("(is Active <player>) and (is Solved) compile in end conditions", () => {
    assert.doesNotThrow(() =>
      compileLudemeSource(`
(game "ActiveGame"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Active P1) (result Mover Win)))
    )
)`),
    );
    assert.doesNotThrow(() =>
      compileLudemeSource(`
(game "SolvedGame"
    (players 1)
    (equipment { (board (square 3)) (piece "Disc" P1) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Solved) (result P1 Win)))
    )
)`),
    );
  });
});

describe("LudemeGame: extra (move …) keyword forms", () => {
  const compiles = (label: string, moves: string, players = 2) =>
    assert.doesNotThrow(
      () =>
        compileLudemeSource(`
(game "MoveForms"
    (players ${players})
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play ${moves})
        (end (if (= (count Pieces P1) 99) (result P1 Win)))
    )
)`),
      label,
    );

  it("(move Swap Pieces …), (move Propose …), (move Bet …) compile", () => {
    compiles("swap pieces", `(move Swap Pieces (centrePoint) (centrePoint))`);
    compiles("propose", `(move Propose "Conclude")`);
    compiles("bet", `(move Bet P1 (range 0 3))`);
  });

  it("(move Set NextPlayer …) and (move Swap Players …) compile", () => {
    compiles("set next", `(move Set NextPlayer (player (next)))`);
    compiles("swap players", `(move Swap Players P1 P2)`);
  });
});
