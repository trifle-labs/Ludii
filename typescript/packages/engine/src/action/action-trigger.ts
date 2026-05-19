/** Java parity: Core/src/other/action/state/ActionTrigger.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionTrigger extends BaseAction {
  public static readonly TYPE: ActionType = "Trigger";

  private readonly eventName: string;
  private readonly player: number;

  public constructor(event: string, player: number) {
    super();
    this.eventName = event;
    this.player = player;
  }

  public override apply(state: State): State {
    // Trigger fires an event handler; the State here is unchanged. Game
    // rules consume the event via the Move's `then`-chain.
    return state;
  }
  public override actionType(): ActionType {
    return ActionTrigger.TYPE;
  }
  public override message(): string {
    return this.eventName;
  }
  public override who(): number {
    return this.player;
  }
}
