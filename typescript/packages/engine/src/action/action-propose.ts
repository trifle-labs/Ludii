// @java Core/src/other/action/others/ActionPropose.java ActionPropose
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
    // @java ActionPropose.apply (ActionPropose.java:68) —
    // context.state().propositions().add(propositionInt). The TS state stores
    // the proposition string itself (see StateOptions.propositions).
    return state.withPropositionAdded(this.propositionText);
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
