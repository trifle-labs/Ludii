// @java Core/src/other/action/state/ActionRememberValue.java ActionRememberValue
// @java Core/src/other/action/state/ActionForgetValue.java ActionForgetValue
/**
 * Java parity:
 * - Core/src/other/action/state/ActionRememberValue.java
 * - Core/src/other/action/state/ActionForgetValue.java
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionRememberValue extends BaseAction {
  public static readonly TYPE: ActionType = "Remember";

  private readonly name: string;
  private readonly valueValue: number;

  public constructor(name: string, value: number) {
    super();
    this.name = name;
    this.valueValue = value;
  }

  public override apply(state: State): State {
    return state.withRemember(this.name, this.valueValue);
  }
  public override actionType(): ActionType {
    return ActionRememberValue.TYPE;
  }
  public override message(): string {
    return this.name;
  }
  public override value(): number {
    return this.valueValue;
  }
}

export class ActionForgetValue extends BaseAction {
  public static readonly TYPE: ActionType = "Forget";

  private readonly name: string;
  private readonly valueValue: number;

  public constructor(name: string, value: number) {
    super();
    this.name = name;
    this.valueValue = value;
  }

  public override apply(state: State): State {
    return state.withForget(this.name, this.valueValue);
  }
  public override actionType(): ActionType {
    return ActionForgetValue.TYPE;
  }
  public override message(): string {
    return this.name;
  }
  public override value(): number {
    return this.valueValue;
  }
}
