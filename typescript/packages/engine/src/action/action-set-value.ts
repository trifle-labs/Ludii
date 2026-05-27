// @java Core/src/other/action/state/ActionSetValue.java ActionSetValue
/**
 * Java parity: Core/src/other/action/state/ActionSetValue.java.
 * Sets the value of a site (distinct from the piece's owner).
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetValueOptions {
  readonly to: number;
  readonly value: number;
}

export class ActionSetValue extends BaseAction {
  public static readonly TYPE: ActionType = "SetValue";

  private readonly toIndex: number;
  private readonly valueValue: number;

  public constructor(options: ActionSetValueOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetValue.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.valueValue = options.value;
  }

  public override apply(state: State): State {
    return state.withValueAt(this.toIndex, this.valueValue);
  }

  public override actionType(): ActionType {
    return ActionSetValue.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override value(): number {
    return this.valueValue;
  }
}
