/**
 * Java parity: Core/src/other/action/state/ActionSetState.java.
 * Sets the local "state" property of a site (e.g. orientation).
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetStateOptions {
  readonly to: number;
  readonly state: number;
}

export class ActionSetState extends BaseAction {
  public static readonly TYPE: ActionType = "SetState";

  private readonly toIndex: number;
  private readonly stateValue: number;

  public constructor(options: ActionSetStateOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetState.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.stateValue = options.state;
  }

  public override apply(state: State): State {
    return state.withStateAt(this.toIndex, this.stateValue);
  }

  public override actionType(): ActionType {
    return ActionSetState.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override state(): number {
    return this.stateValue;
  }
}
