// @java Core/src/other/action/state/ActionSetTemp.java ActionSetTemp
/** Java parity: Core/src/other/action/state/ActionSetTemp.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetTemp extends BaseAction {
  public static readonly TYPE: ActionType = "SetTemp";

  private readonly player: number;
  private readonly tempValue: number;

  public constructor(player: number, value: number) {
    super();
    this.player = player;
    this.tempValue = value;
  }

  public override apply(state: State): State {
    return state.withTemp(this.player, this.tempValue);
  }
  public override actionType(): ActionType {
    return ActionSetTemp.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override value(): number {
    return this.tempValue;
  }
}
