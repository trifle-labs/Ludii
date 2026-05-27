// @java Core/src/other/action/state/ActionSetRotation.java ActionSetRotation
/** Java parity: Core/src/other/action/state/ActionSetRotation.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetRotationOptions {
  readonly to: number;
  readonly rotation: number;
}

export class ActionSetRotation extends BaseAction {
  public static readonly TYPE: ActionType = "SetRotation";

  private readonly toIndex: number;
  private readonly rotationValue: number;

  public constructor(options: ActionSetRotationOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetRotation.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.rotationValue = options.rotation;
  }

  public override apply(state: State): State {
    return state.withRotationAt(this.toIndex, this.rotationValue);
  }

  public override actionType(): ActionType {
    return ActionSetRotation.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override rotation(): number {
    return this.rotationValue;
  }
}
