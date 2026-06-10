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
    // @java ActionSetValue.java — Java actions never validate in the
    // constructor; an OFF site (-1, e.g. Alice Chess generating
    // (set Value at:(last To) ...) before any move exists) simply
    // applies as a no-op.
    this.toIndex = Number.isInteger(options.to) ? options.to : -1;
    this.valueValue = options.value;
  }

  public override apply(state: State): State {
    if (this.toIndex < 0) return state;
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
