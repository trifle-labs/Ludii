// @java Core/src/other/action/state/ActionSetVar.java ActionSetVar
/** Java parity: Core/src/other/action/state/ActionSetVar.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSetVar extends BaseAction {
  public static readonly TYPE: ActionType = "SetVar";

  private readonly varName: string;
  private readonly varValue: number;

  public constructor(name: string, value: number) {
    super();
    this.varName = name;
    this.varValue = value;
  }

  public override apply(state: State): State {
    return state.withVar(this.varName, this.varValue);
  }
  public override actionType(): ActionType {
    return ActionSetVar.TYPE;
  }
  public override message(): string {
    return this.varName;
  }
  public override value(): number {
    return this.varValue;
  }
}
