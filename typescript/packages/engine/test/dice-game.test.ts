import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DiceGame, SeededRng } from "../src/index.js";

describe("DiceGame (pig)", () => {
  it("offers Roll and Hold on every non-terminal turn", () => {
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 50,
    });
    const ctx = game.start(new SeededRng(0xdeadbeef));
    const moves = game.moves(ctx);
    assert.equal(moves.length, 2);
    assert.equal(moves[0]?.label, "Roll P1");
    assert.ok(moves[1]?.label.startsWith("Hold P1"));
  });

  it("rolling consumes the rng and stores dice values in state", () => {
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 100,
    });
    const ctx = game.start(new SeededRng(0xdeadbeef));
    const roll = game.moves(ctx)[0];
    if (!roll) throw new Error("expected roll");
    const next = game.apply(ctx, roll);
    assert.equal(next.state.diceValues.length, 2);
    for (const v of next.state.diceValues) {
      assert.ok(v >= 1 && v <= 6);
    }
  });

  it("non-bust roll accumulates turn total and keeps the mover", () => {
    // Find a seed where the first two dice are both > 1.
    let seed = 1;
    let pickedSeed = 0;
    while (seed < 1000) {
      const rng = new SeededRng(seed);
      const a = rng.nextInt(6) + 1;
      const b = rng.nextInt(6) + 1;
      if (a > 1 && b > 1) {
        pickedSeed = seed;
        break;
      }
      seed += 1;
    }
    assert.notEqual(pickedSeed, 0, "expected to find a non-bust seed");
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 100,
    });
    const ctx = game.start(new SeededRng(pickedSeed));
    const roll = game.moves(ctx)[0];
    if (!roll) throw new Error("expected roll");
    const next = game.apply(ctx, roll);
    const [a, b] = next.state.diceValues;
    if (a === undefined || b === undefined) {
      throw new Error("expected two dice values");
    }
    assert.equal(next.state.mover, 1);
    assert.equal(next.state.temp(1), a + b);
  });

  it("bust roll wipes turn total and passes the turn", () => {
    let seed = 1;
    let pickedSeed = 0;
    while (seed < 1000) {
      const rng = new SeededRng(seed);
      const a = rng.nextInt(6) + 1;
      const b = rng.nextInt(6) + 1;
      if (a === 1 || b === 1) {
        pickedSeed = seed;
        break;
      }
      seed += 1;
    }
    assert.notEqual(pickedSeed, 0, "expected to find a bust seed");
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 100,
    });
    const ctx = game.start(new SeededRng(pickedSeed));
    const roll = game.moves(ctx)[0];
    if (!roll) throw new Error("expected roll");
    const next = game.apply(ctx, roll);
    assert.equal(next.state.temp(1), 0);
    assert.equal(next.state.mover, 2);
  });

  it("hold banks the turn total and ends the turn", () => {
    let seed = 1;
    let pickedSeed = 0;
    while (seed < 1000) {
      const rng = new SeededRng(seed);
      const a = rng.nextInt(6) + 1;
      const b = rng.nextInt(6) + 1;
      if (a > 1 && b > 1) {
        pickedSeed = seed;
        break;
      }
      seed += 1;
    }
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 100,
    });
    let ctx = game.start(new SeededRng(pickedSeed));
    const roll = game.moves(ctx)[0];
    if (!roll) throw new Error("expected roll");
    ctx = game.apply(ctx, roll);
    const accumulated = ctx.state.temp(1);
    const hold = game.moves(ctx).find((m) => m.id.includes("hold"));
    if (!hold) throw new Error("expected a hold move");
    ctx = game.apply(ctx, hold);
    assert.equal(ctx.state.score(1), accumulated);
    assert.equal(ctx.state.temp(1), 0);
    assert.equal(ctx.state.mover, 2);
  });

  it("hold ends the game when the banked score reaches goalScore", () => {
    const game = new DiceGame({
      id: "pig",
      name: "Pig",
      numPlayers: 2,
      goalScore: 5,
    });
    // Drive forward enough non-bust rolls for P1, then hold.
    let ctx = game.start(new SeededRng(0xc0ffee));
    while (!ctx.over) {
      const moves = game.moves(ctx);
      const roll = moves[0];
      if (!roll) break;
      ctx = game.apply(ctx, roll);
      if (ctx.state.mover === 1 && ctx.state.temp(1) >= 5) {
        const hold = game.moves(ctx).find((m) => m.id.includes("hold"));
        if (hold) ctx = game.apply(ctx, hold);
      }
      // Safety circuit-breaker.
      if (ctx.trial.numMoves > 200) break;
    }
    assert.equal(ctx.over, true);
    assert.equal(ctx.winner, 1);
  });
});

describe("DiceGame (race)", () => {
  it("offers only the Roll move", () => {
    const game = new DiceGame({
      id: "race",
      name: "Race",
      numPlayers: 2,
      mode: "race",
      trackLength: 20,
    });
    const ctx = game.start(new SeededRng(7));
    const moves = game.moves(ctx);
    assert.equal(moves.length, 1);
    assert.equal(moves[0]?.label, "Roll P1");
  });

  it("advances the mover's amount by the pip total each roll", () => {
    const game = new DiceGame({
      id: "race",
      name: "Race",
      numPlayers: 2,
      mode: "race",
      trackLength: 100,
    });
    let ctx = game.start(new SeededRng(7));
    const before = ctx.state.amount(1);
    const roll = game.moves(ctx)[0];
    if (!roll) throw new Error("expected a roll");
    ctx = game.apply(ctx, roll);
    const sum = ctx.state.diceValues.reduce((a, b) => a + b, 0);
    assert.equal(ctx.state.amount(1), before + sum);
    assert.equal(ctx.state.mover, 2);
  });

  it("declares the mover the winner when amount reaches trackLength", () => {
    const game = new DiceGame({
      id: "race",
      name: "Race",
      numPlayers: 2,
      mode: "race",
      trackLength: 6,
    });
    let ctx = game.start(new SeededRng(42));
    let safety = 0;
    while (!ctx.over && safety < 200) {
      const r = game.moves(ctx)[0];
      if (!r) break;
      ctx = game.apply(ctx, r);
      safety += 1;
    }
    assert.equal(ctx.over, true);
    assert.ok(ctx.winner === 1 || ctx.winner === 2);
  });
});
