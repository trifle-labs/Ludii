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

  public constructor(toIndex: number, delta: number, seedOwner: number) {
    super();
    this.toIndex = toIndex;
    this.delta = delta;
    this.seedOwner = seedOwner;
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
