/** Java parity: Core/src/other/action/others/ActionPropose.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionPropose extends BaseAction {
  public static readonly TYPE: ActionType = "Propose";

  private readonly propositionText: string;

  public constructor(proposition: string) {
    super();
    this.propositionText = proposition;
  }

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionPropose.TYPE;
  }
  public override isPropose(): boolean {
    return true;
  }
  public override proposition(): string {
    return this.propositionText;
  }
}
