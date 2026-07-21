// @java Core/src/other/action/state/ActionSetNextPlayer.java ActionSetNextPlayer
/** Java parity: Core/src/other/action/state/ActionSetNextPlayer.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetNextPlayer extends BaseAction {
  public static readonly TYPE: ActionType = "SetNextPlayer";

  private readonly player: number;

  public constructor(player: number) {
    super();
    this.player = player;
  }

  public override apply(state: State): State {
    return state.withNext(this.player);
  }
  public override actionType(): ActionType {
    return ActionSetNextPlayer.TYPE;
  }
  public override who(): number {
    return this.player;
  }
}
