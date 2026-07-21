// @java Core/src/other/action/move/ActionInsert.java ActionInsert
/**
 * Java parity: Core/src/other/action/move/ActionInsert.java —
 * insert a piece into a stack at a specific level.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionInsertOptions {
  readonly to: number;
  readonly what: number;
  readonly level: number;
}

export class ActionInsert extends BaseAction {
  public static readonly TYPE: ActionType = "Insert";

  private readonly toIndex: number;
  private readonly whatValue: number;
  private readonly levelValue: number;

  public constructor(options: ActionInsertOptions) {
    super();
    this.toIndex = options.to;
    this.whatValue = options.what;
    this.levelValue = options.level;
  }

  public override apply(state: State): State {
    // The TS MVE doesn't carry arbitrary mid-stack insertion in its
    // stack data (push/pop only). For now we approximate insert as a
    // push (i.e. insert at the top); the level is preserved as
    // bookkeeping but doesn't reshape the stack contents.
    return state.withStackPush(this.toIndex, this.whatValue);
  }

  public override actionType(): ActionType {
    return ActionInsert.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override what(): number {
    return this.whatValue;
  }
  public override levelTo(): number {
    return this.levelValue;
  }
  public override isStacking(): boolean {
    return true;
  }
}
