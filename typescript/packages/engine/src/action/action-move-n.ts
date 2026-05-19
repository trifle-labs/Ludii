/**
 * Java parity: Core/src/other/action/move/ActionMoveN.java — move N
 * pieces from a stack/site to another.
 */

import type { State } from "../state.js";
import { ACTION_OFF, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionMoveNOptions {
  readonly from: number;
  readonly to: number;
  readonly count: number;
}

export class ActionMoveN extends BaseAction {
  public static readonly TYPE: ActionType = "MoveN";

  private readonly fromIndex: number;
  private readonly toIndex: number;
  private readonly countValue: number;

  public constructor(options: ActionMoveNOptions) {
    super();
    if (!Number.isInteger(options.count) || options.count < 1) {
      throw new RangeError("ActionMoveN.count must be a positive integer.");
    }
    this.fromIndex = options.from;
    this.toIndex = options.to;
    this.countValue = options.count;
  }

  public override apply(state: State): State {
    // For non-stacking games we ignore count (single-piece moves); for
    // stacking games we pop `count` pieces from `from` and push them to
    // `to`. Java semantics: pop from top, push in popped order so the
    // bottom of the moved pile ends up on top of the destination.
    let next = state;
    const popped: number[] = [];
    for (let i = 0; i < this.countValue; i += 1) {
      const top = next.stackAt(
        this.fromIndex,
        next.stackSize(this.fromIndex) - 1,
      );
      if (top === 0) break;
      popped.push(top);
      next = next.withStackPop(this.fromIndex);
    }
    for (const owner of popped) {
      next = next.withStackPush(this.toIndex, owner);
    }
    return next;
  }

  public override actionType(): ActionType {
    return ActionMoveN.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override count(): number {
    return this.countValue;
  }
  public override value(): number {
    return ACTION_OFF;
  }
}
