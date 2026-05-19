/**
 * Java parity:
 * - Core/src/other/action/move/ActionSubStackMove.java
 *
 * Move a contiguous sub-stack of pieces (from level `levelFrom` up) to
 * the destination, preserving order. With the TS stack model this is
 * `count` pops + `count` pushes.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionStackMove extends BaseAction {
  public static readonly TYPE: ActionType = "StackMove";

  private readonly fromIndex: number;
  private readonly toIndex: number;
  private readonly fromLevel: number;

  public constructor(from: number, fromLevel: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
    this.fromLevel = fromLevel;
    this.levelFromValue = fromLevel;
  }

  public override apply(state: State): State {
    const fromSize = state.stackSize(this.fromIndex);
    if (fromSize === 0) {
      const single = state.cells[this.fromIndex] ?? 0;
      if (single === 0) return state;
      return state
        .withCell(this.fromIndex, 0)
        .withStackPush(this.toIndex, single);
    }
    const sliceCount = Math.max(0, fromSize - this.fromLevel);
    if (sliceCount === 0) return state;
    const pieces: number[] = [];
    let next = state;
    for (let i = 0; i < sliceCount; i++) {
      pieces.push(
        next.stackAt(this.fromIndex, next.stackSize(this.fromIndex) - 1),
      );
      next = next.withStackPop(this.fromIndex);
    }
    // pieces collected top-down; restore original order on destination.
    for (let i = pieces.length - 1; i >= 0; i--) {
      next = next.withStackPush(this.toIndex, pieces[i] ?? 0);
    }
    return next;
  }
  public override actionType(): ActionType {
    return ActionStackMove.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override levelFrom(): number {
    return this.fromLevel;
  }
  public override isStacking(): boolean {
    return true;
  }
}
