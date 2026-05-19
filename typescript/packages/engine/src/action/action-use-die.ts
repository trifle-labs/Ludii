/** Java parity: Core/src/other/action/die/ActionUseDie.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionUseDie extends BaseAction {
  public static readonly TYPE: ActionType = "UseDie";

  private readonly dieIndex: number;
  private readonly siteIndex: number;

  public constructor(dieIndex: number, siteIndex: number) {
    super();
    this.dieIndex = dieIndex;
    this.siteIndex = siteIndex;
  }

  public override apply(state: State): State {
    // Marking a die as used is recorded in the engine's container state
    // (which the MVE does not yet model in detail). The state remains
    // unchanged here; the action is still useful for move bookkeeping.
    return state;
  }
  public override actionType(): ActionType {
    return ActionUseDie.TYPE;
  }
  public override from(): number {
    return this.dieIndex;
  }
  public override to(): number {
    return this.siteIndex;
  }
}
