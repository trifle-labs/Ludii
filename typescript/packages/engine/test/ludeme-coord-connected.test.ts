import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compileLudemeSource } from "../src/index.js";

// `(column of:<site>)` / `(row of:<site>)` read the x/y of a site, and
// `(coord …)` maps a chess coordinate (or row:/column:) back to a site index.
// These int ludemes are pervasive in chess-family and connection games. The
// `(is Connected …)` bool and `(sites Side <compass>)` region back the goal
// tests of connection games (Hex/Y). These tests pin down compile-and-apply.

// 3x3 board, P1 seeds the bottom-left corner, P2 the opposite corner, and a
// single Add move drops onto an empty site whose effect records a coordinate.
function game(board: string, place: string, to: string, effect: string): string {
  return `
(game "CoordConnected"
    (players 2)
    (equipment {
        (board ${board})
        (piece "Disc" Each)
    })
    (rules
        (start {
            (place "Disc1" (sites {${place}}))
        })
        (play (move Add (to (sites {${to}})) (then ${effect})))
        (end (if (= (count Pieces P1) 99) (result P1 Win)))
    )
)`;
}

function applyTo(src: string, toSite: number) {
  const compiled = compileLudemeSource(src);
  const ctx = compiled.start();
  const move = compiled.moves(ctx).find((m) => m.to() === toSite);
  assert.ok(move, `the Add move onto site ${toSite} exists`);
  return compiled.apply(ctx, move);
}

describe("LudemeGame: (column …)/(row …)/(coord …) int ludemes", () => {
  it("(column of:(to)) reads the x of the destination", () => {
    // (rectangle 3 3) → 3x3; site 5 is at column 2, row 1.
    const next = applyTo(
      game("(rectangle 3 3)", "0", "5", `(set Value Mover (column of:(to)))`),
      5,
    );
    assert.equal(next.state.valuePlayer(1), 2, "column of site 5 is 2");
  });

  it("(row of:(to)) reads the y of the destination", () => {
    const next = applyTo(
      game("(rectangle 3 3)", "0", "5", `(set Value Mover (row of:(to)))`),
      5,
    );
    assert.equal(next.state.valuePlayer(1), 1, "row of site 5 is 1");
  });

  it("(coord \"B1\") maps a coordinate to its site index", () => {
    // B1 → column 1, row 0 → site 1 on a 3x3 board.
    const next = applyTo(
      game("(rectangle 3 3)", "0", "4", `(set Counter (coord "B1"))`),
      4,
    );
    assert.equal(next.state.counter, 1, "B1 resolves to site index 1");
  });

  it("(coord row:<n> column:<n>) maps row/column to a site index", () => {
    const next = applyTo(
      game(
        "(rectangle 3 3)",
        "0",
        "4",
        `(set Counter (coord row:2 column:1))`,
      ),
      4,
    );
    assert.equal(next.state.counter, 7, "row 2, column 1 is site 7");
  });
});

describe("LudemeGame: grammar coverage for new rule forms", () => {
  const compiles = (effectOrCond: string, src: string) =>
    assert.doesNotThrow(() => compileLudemeSource(src), effectOrCond);

  it("(sites Side <compass>) compiles in a region context", () => {
    compiles(
      "sites Side",
      `
(game "SideRegion"
    (players 2)
    (equipment { (board (square 5)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected { (sites Side N) (sites Side S) }) (result Mover Win)))
    )
)`,
    );
  });

  it("(is Connected Mover) compiles", () => {
    compiles(
      "is Connected Mover",
      `
(game "ConnGame"
    (players 2)
    (equipment { (board (square 5)) (piece "Disc" Each) })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
    )
)`,
    );
  });

  it("(all Passed) compiles in an end condition", () => {
    compiles(
      "all Passed",
      `
(game "PassGame"
    (players 2)
    (equipment { (board (square 3)) (piece "Disc" Each) })
    (rules
        (play (or (move Add (to (sites Empty))) (move Pass)))
        (end (if (all Passed) (result Mover Draw)))
    )
)`,
    );
  });
});
