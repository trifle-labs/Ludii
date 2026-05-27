// @java Core/src/other/action/move/move/ActionMoveLevelFrom.java ActionMoveLevelFrom
// @java Core/src/other/action/move/move/ActionMoveLevelTo.java ActionMoveLevelTo
// @java Core/src/other/action/move/move/ActionMoveLevelFromLevelTo.java ActionMoveLevelFromLevelTo
/**
 * Java parity:
 * - Core/src/other/action/move/move/ActionMoveLevelFrom.java
 * - Core/src/other/action/move/move/ActionMoveLevelTo.java
 * - Core/src/other/action/move/move/ActionMoveLevelFromLevelTo.java
 *
 * In Java these are three concrete subclasses of the Move family, each
 * recording one or both of the from/to stack levels. The MVE's stack
 * model is push/pop-only so it can't slice mid-stack faithfully — the
 * action records the level metadata (preserved for Move shape) and
 * applies the surface effect of relocating the top piece.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

abstract class ActionMoveLevelBase extends BaseAction {
  protected readonly fromIndex: number;
  protected readonly toIndex: number;

  protected constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    const stackSize = state.stackSize(this.fromIndex);
    const topLevel = stackSize - 1;
    const stackLen = state.stacks[this.fromIndex]?.length ?? 0;
    const movingOwner =
      stackSize > 0
        ? state.whoAtSiteLevel(this.fromIndex, topLevel)
        : (state.cells[this.fromIndex] ?? 0);
    if (movingOwner === 0) return state;
    const movingWhat =
      stackSize > 0
        ? state.whatAtSiteLevel(this.fromIndex, topLevel)
        : state.whatAtSite(this.fromIndex);
    const countedLevels = state.countAtSite(this.fromIndex);
    const countBacked = countedLevels > 0 && stackLen <= 1;
    if (countBacked) {
      const fromCount = countedLevels;
      const toCount = state.countAtSite(this.toIndex);
      let next = state
        .withCountAt(this.fromIndex, Math.max(0, fromCount - 1))
        .withCountAt(this.toIndex, toCount + 1);
      if ((next.cells[this.toIndex] ?? 0) === 0) {
        next = next.withCell(this.toIndex, movingOwner);
      }
      if (fromCount === 1 && (stackLen <= 1 || stackLen === fromCount)) {
        next = next.withCell(this.fromIndex, 0);
      }
      return next;
    }
    const popped = state.withStackPop(this.fromIndex);
    return popped.withStackPush(this.toIndex, movingOwner, movingWhat);
  }
  public override actionType(): ActionType {
    return "Move";
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override isStacking(): boolean {
    return true;
  }
}

export class ActionMoveLevelFrom extends ActionMoveLevelBase {
  private readonly fromLevelValue: number;
  public constructor(from: number, fromLevel: number, to: number) {
    super(from, to);
    this.fromLevelValue = fromLevel;
    this.levelFromValue = fromLevel;
  }
  public override levelFrom(): number {
    return this.fromLevelValue;
  }
}

export class ActionMoveLevelTo extends ActionMoveLevelBase {
  private readonly toLevelValue: number;
  public constructor(from: number, to: number, toLevel: number) {
    super(from, to);
    this.toLevelValue = toLevel;
    this.levelToValue = toLevel;
  }
  public override levelTo(): number {
    return this.toLevelValue;
  }
}

export class ActionMoveLevelFromLevelTo extends ActionMoveLevelBase {
  private readonly fromLevelValue: number;
  private readonly toLevelValue: number;
  public constructor(
    from: number,
    fromLevel: number,
    to: number,
    toLevel: number,
  ) {
    super(from, to);
    this.fromLevelValue = fromLevel;
    this.toLevelValue = toLevel;
    this.levelFromValue = fromLevel;
    this.levelToValue = toLevel;
  }
  public override levelFrom(): number {
    return this.fromLevelValue;
  }
  public override levelTo(): number {
    return this.toLevelValue;
  }
}
