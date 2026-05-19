import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { State } from "../src/index.js";

describe("State scores / values per player", () => {
  it("initialises score/value arrays sized numPlayers + 1", () => {
    const s = new State(1, new Array(9).fill(0), ["X", "O"]);
    // [neutral, P1, P2] => 3 slots
    assert.equal(s.scores.length, 3);
    assert.equal(s.valuesPlayer.length, 3);
    assert.equal(s.score(1), 0);
    assert.equal(s.valuePlayer(2), 0);
  });

  it("withScore returns a new state with the score updated", () => {
    const s0 = new State(1, new Array(9).fill(0), ["X", "O"]);
    const s1 = s0.withScore(1, 5).withScore(2, -3);
    assert.equal(s0.score(1), 0); // immutable
    assert.equal(s1.score(1), 5);
    assert.equal(s1.score(2), -3);
  });

  it("withValuePlayer returns a new state with the value updated", () => {
    const s0 = new State(1, new Array(9).fill(0), ["X", "O"]);
    const s1 = s0.withValuePlayer(1, 7);
    assert.equal(s1.valuePlayer(1), 7);
    assert.equal(s0.valuePlayer(1), 0);
  });

  it("withCell preserves scores / values", () => {
    const s0 = new State(1, new Array(9).fill(0), ["X", "O"]).withScore(1, 4);
    const s1 = s0.withCell(0, 1);
    assert.equal(s1.score(1), 4);
    assert.equal(s1.cellAt(0).owner, 1);
  });

  it("containerState() reports per-site who/what/count/isEmpty", () => {
    const s = new State(1, [0, 1, 2, 0], ["X", "O"]);
    const c = s.containerState();
    assert.equal(c.size, 4);
    assert.equal(c.isEmpty(0), true);
    assert.equal(c.isEmpty(1), false);
    assert.equal(c.who(1), 1);
    assert.equal(c.what(2), 2);
    assert.equal(c.count(0), 0);
    assert.equal(c.count(1), 1);
  });

  it("withScore rejects out-of-range pid", () => {
    const s = new State(1, [0, 0], ["X", "O"]);
    assert.throws(() => s.withScore(-1, 1));
    assert.throws(() => s.withScore(5, 1));
  });
});
