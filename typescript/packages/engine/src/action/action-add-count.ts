// @java (none) — TS-only, mancala seed-count semantics
/**
 * Adjusts the seed count at a site by a (possibly negative) delta, keeping the
 * cell's occupancy in sync so `(is Empty)` / `(is Occupied)` stay correct.
 *
 * Mancala games track seeds as a per-site count rather than a stack of owned
 * pieces, so `(sow)` and `(fromTo … count:)` move seeds by incrementing and
 * decrementing these counts. Reuses the `SetCount` action type.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionAddCount extends BaseAction {
  public static readonly TYPE: ActionType = "SetCount";

  private readonly toIndex: number;
  private readonly delta: number;
  private readonly seedOwner: number;

  /** @java the seed component carried by the sow (pits keep what while count>0). */
  private readonly seedWhat: number;

  public constructor(toIndex: number, delta: number, seedOwner: number, seedWhat = 0) {
    super();
    this.toIndex = toIndex;
    this.delta = delta;
    this.seedOwner = seedOwner;
    this.seedWhat = seedWhat;
  }

  public override apply(state: State): State {
    if (this.toIndex < 0 || this.toIndex >= state.cells.length) return state;
    const next = Math.max(0, state.countAtSite(this.toIndex) + this.delta);
    let s = state.withCountAt(this.toIndex, next);
    const owner = next > 0 ? this.seedOwner : 0;
    if ((s.cells[this.toIndex] ?? 0) !== owner) {
      s = s.withCell(this.toIndex, owner);
    }
    if (next === 0 && s.whatAtSite(this.toIndex) !== 0) {
      s = s.withWhatAt(this.toIndex, 0);
    }
    // @java pits hold the Seed component while seeded (SetCount.java:79 stamps
    // it at start; sow drops keep it) — stamp on a what-less pit gaining seeds.
    // Raw whats check: whatAtSite falls back to the cells owner, which the
    // seedOwner stamping above just wrote.
    if (next > 0 && this.seedWhat > 0 && (s.whats[this.toIndex] ?? 0) === 0) {
      s = s.withWhatAt(this.toIndex, this.seedWhat);
    }
    // When a site is emptied (count → 0), Java's container `remove()` (called by
    // ActionMoveN.apply, ActionMoveN.java:276-277, when count drops ≤ 0) resets
    // ALL per-site properties to 0 — including the per-site `state`. This clears
    // stale tuz/owned-hole markers (state > 0 from a previous round) when a hole
    // is drained, which the next round's relay/tuz-creation conditions depend on
    // (Tuz, Gabata, Mewegae, Selus families). TS never reset state here, so stale
    // markers persisted across rounds. Mirror Java: clear state on empty.
    if (next === 0 && (s.stateAtSite(this.toIndex) ?? 0) !== 0) {
      s = s.withStateAt(this.toIndex, 0);
    }
    return s;
  }

  public override actionType(): ActionType {
    return ActionAddCount.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override count(): number {
    return this.delta;
  }
}
