/** Java parity: Core/src/other/action/others/ActionNote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionNote extends BaseAction {
  public static readonly TYPE: ActionType = "Note";

  private readonly messageText: string;
  private readonly playerIndex: number;

  public constructor(message: string, player: number) {
    super();
    this.messageText = message;
    this.playerIndex = player;
  }

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionNote.TYPE;
  }
  public override message(): string {
    return this.messageText;
  }
  public override playerSelected(): number {
    return this.playerIndex;
  }
}
