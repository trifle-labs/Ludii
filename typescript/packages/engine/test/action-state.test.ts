import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ActionBet,
  ActionForgetValue,
  ActionRememberValue,
  ActionSetAmount,
  ActionSetCount,
  ActionSetCounter,
  ActionSetDiceAllEqual,
  ActionSetHidden,
  ActionSetNextPlayer,
  ActionSetPending,
  ActionSetPhase,
  ActionSetPot,
  ActionSetRotation,
  ActionSetScore,
  ActionSetState,
  ActionSetTemp,
  ActionSetTrumpSuit,
  ActionSetValue,
  ActionSetValueOfPlayer,
  ActionSetVar,
  ActionStoreStateInContext,
  ActionSwap,
  ActionToggle,
  ActionTrigger,
  State,
} from "../src/index.js";

function emptyState(siteCount: number): State {
  return new State(1, new Array<number>(siteCount).fill(0), ["X", "O"]);
}

describe("state-channel actions", () => {
  it("ActionSetScore writes scores[pid]", () => {
    const after = new ActionSetScore({ player: 1, score: 5 }).apply(
      emptyState(9),
    );
    assert.equal(after.score(1), 5);
  });

  it("ActionSetScore add=true adds to existing", () => {
    const before = new ActionSetScore({ player: 1, score: 5 }).apply(
      emptyState(9),
    );
    const after = new ActionSetScore({ player: 1, score: 3, add: true }).apply(
      before,
    );
    assert.equal(after.score(1), 8);
  });

  it("ActionSetCount writes countAt", () => {
    const after = new ActionSetCount({ to: 2, count: 7 }).apply(emptyState(9));
    assert.equal(after.countAtSite(2), 7);
  });

  it("ActionSetValue writes valueAt", () => {
    const after = new ActionSetValue({ to: 2, value: 7 }).apply(emptyState(9));
    assert.equal(after.valueAtSite(2), 7);
  });

  it("ActionSetState writes stateAt", () => {
    const after = new ActionSetState({ to: 2, state: 7 }).apply(emptyState(9));
    assert.equal(after.stateAtSite(2), 7);
  });

  it("ActionSetRotation writes rotationAt", () => {
    const after = new ActionSetRotation({ to: 2, rotation: 3 }).apply(
      emptyState(9),
    );
    assert.equal(after.rotationAtSite(2), 3);
  });

  it("ActionSetCounter writes counter", () => {
    const after = new ActionSetCounter(42).apply(emptyState(9));
    assert.equal(after.counter, 42);
  });

  it("ActionSetPhase writes per-player phase", () => {
    const after = new ActionSetPhase(1, 2).apply(emptyState(9));
    assert.equal(after.phase(1), 2);
  });

  it("ActionSetTemp writes the global temp; Amount stays per-player", () => {
    // @java State.tempValue — single global slot, default Constants.UNDEFINED
    let s = new ActionSetTemp(9).apply(emptyState(9));
    s = new ActionSetAmount(1, 7).apply(s);
    assert.equal(s.temp(), 9);
    assert.equal(s.amount(1), 7);
  });

  it("ActionSetPot writes pot", () => {
    const after = new ActionSetPot(11).apply(emptyState(9));
    assert.equal(after.pot, 11);
  });

  it("ActionBet sets the player's amount to the bet (pot untouched)", () => {
    // @java ActionBet.java:84 — `context.state().setAmount(player, bet)`;
    // the pot is only moved by the game's own `(set Pot …)` consequence.
    const seeded = new ActionSetAmount(1, 10).apply(emptyState(9));
    const after = new ActionBet(1, 4).apply(seeded);
    assert.equal(after.amount(1), 4);
    assert.equal(after.pot, 0);
  });

  it("ActionSetTrumpSuit writes trumpSuit", () => {
    const after = new ActionSetTrumpSuit(3).apply(emptyState(9));
    assert.equal(after.trumpSuit, 3);
  });

  it("ActionSetNextPlayer writes next", () => {
    const after = new ActionSetNextPlayer(2).apply(emptyState(9));
    assert.equal(after.next, 2);
  });

  it("ActionSetValueOfPlayer writes valuesPlayer", () => {
    const after = new ActionSetValueOfPlayer(1, 9).apply(emptyState(9));
    assert.equal(after.valuePlayer(1), 9);
  });

  it("ActionSetVar / SetPending tracked", () => {
    const after = new ActionSetVar("k", 9).apply(emptyState(9));
    assert.equal(after.getVar("k"), 9);
    const pending = new ActionSetPending(4).apply(after);
    assert.equal(pending.isPending(4), true);
  });

  it("ActionRememberValue / ForgetValue use named lists", () => {
    let s = new ActionRememberValue("foo", 1).apply(emptyState(9));
    s = new ActionRememberValue("foo", 2).apply(s);
    assert.deepEqual([...s.rememberedFor("foo")], [1, 2]);
    s = new ActionForgetValue("foo", 1).apply(s);
    assert.deepEqual([...s.rememberedFor("foo")], [2]);
  });

  it("ActionSetDiceAllEqual writes diceAllEqual", () => {
    const after = new ActionSetDiceAllEqual(true).apply(emptyState(9));
    assert.equal(after.diceAllEqual, true);
  });

  it("ActionSetHidden flips per-player hiddenForPlayer", () => {
    const after = new ActionSetHidden(2, 1, true).apply(emptyState(9));
    assert.equal(after.isHidden(1, 2), true);
  });

  it("ActionSwap swaps two cells", () => {
    const before = emptyState(9).withCell(0, 1).withCell(8, 2);
    const after = new ActionSwap(0, 8).apply(before);
    assert.equal(after.cellAt(0).owner, 2);
    assert.equal(after.cellAt(8).owner, 1);
  });

  it("ActionToggle flips piece on/off at a site", () => {
    const after = new ActionToggle(3, 1).apply(emptyState(9));
    assert.equal(after.cellAt(3).owner, 1);
    const back = new ActionToggle(3, 1).apply(after);
    assert.equal(back.cellAt(3).owner, 0);
  });

  it("ActionTrigger sets the player's trigger bit (Java triggers(player, true))", () => {
    const s = emptyState(9);
    assert.equal(s.isTriggered(1), false);
    const after = new ActionTrigger("ev", 1).apply(s);
    // Java ActionTrigger.apply → state.triggers(player, true); isTriggered
    // ignores the event name and tests only the player's bit.
    assert.equal(after.isTriggered(1), true);
    assert.equal(after.isTriggered(2), false);
    assert.equal(s.isTriggered(1), false); // original unchanged (immutable)
  });

  it("ActionStoreStateInContext records the state hash (Java storeCurrentState)", () => {
    const s = emptyState(9);
    const after = new ActionStoreStateInContext().apply(s);
    // Faithful to Java: storedState = state.stateHash() at apply time.
    assert.equal(after.storedState, s.hash());
    assert.equal(s.storedState, 0); // default before any store
  });
});
