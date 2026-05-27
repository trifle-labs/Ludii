// @java Core/src/other/action/others/ActionSetValueOfPlayer.java ActionSetValueOfPlayer
/** Java parity: Core/src/other/action/state/ActionSetValueOfPlayer.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetValueOfPlayer extends BaseAction {
  public static readonly TYPE: ActionType = "SetValueOfPlayer";

  private readonly player: number;
  private readonly valueValue: number;

  public constructor(player: number, value: number) {
    super();
    this.player = player;
    this.valueValue = value;
  }

  public override apply(state: State): State {
    return state.withValuePlayer(this.player, this.valueValue);
  }
  public override actionType(): ActionType {
    return ActionSetValueOfPlayer.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override value(): number {
    return this.valueValue;
  }
}
