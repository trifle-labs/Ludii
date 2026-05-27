// @java Core/src/other/action/graph/ActionSetPhase.java ActionSetPhase
/** Java parity: Core/src/other/action/state/ActionSetPhase.java (player phase). */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetPhase extends BaseAction {
  public static readonly TYPE: ActionType = "SetPhase";

  private readonly player: number;
  private readonly phaseValue: number;

  public constructor(player: number, phase: number) {
    super();
    if (!Number.isInteger(player) || player < 1) {
      throw new RangeError("ActionSetPhase.player must be a positive integer.");
    }
    this.player = player;
    this.phaseValue = phase;
  }

  public override apply(state: State): State {
    return state.withPhase(this.player, this.phaseValue);
  }
  public override actionType(): ActionType {
    return ActionSetPhase.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override state(): number {
    return this.phaseValue;
  }
}
