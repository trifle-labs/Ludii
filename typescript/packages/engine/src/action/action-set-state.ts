// @java Core/src/other/action/state/ActionSetState.java ActionSetState
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
  /** Graph element type of `to` (Cell/Edge/Vertex). @java ActionSetState.type */
  readonly toType?: string | null;
  /**
   * True when `to` is a NON-default graph element (e.g. Edge on a Cell-default
   * board), so the state belongs in the typed channel, not the flat cell-sized
   * stateAt[]. Computed at move-construction time (needs Context/board).
   */
  readonly toTypedNonDefault?: boolean;
  /**
   * @java ActionSetState.level — the stack level whose state to set;
   * undefined/UNDEFINED(-1) = flat/top (the scalar stateAt write). When >= 0
   * the per-level stateStacks[to][level] channel is written instead
   * (ActionSetState.java:107-121 — the stacking + level path re-inserts the
   * level with the new state; Aj Sakakil's CapturedPiece marking).
   */
  readonly level?: number;
}

export class ActionSetState extends BaseAction {
  public static readonly TYPE: ActionType = "SetState";

  private readonly toIndex: number;
  private readonly stateValue: number;
  private readonly toSiteType: string | null;
  private readonly toTypedNonDefault: boolean;
  /** @java ActionSetState.level; -1 (UNDEFINED) = flat/no level. */
  private readonly levelIndex: number;

  public constructor(options: ActionSetStateOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetState.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.stateValue = options.state;
    this.toSiteType = options.toType ?? null;
    this.toTypedNonDefault = options.toTypedNonDefault ?? false;
    this.levelIndex = options.level ?? -1;
  }

  public override apply(state: State): State {
    if (this.toTypedNonDefault && this.toSiteType) {
      return state.withTypedAttr(this.toSiteType, this.toIndex, "state", this.stateValue);
    }
    // @java ActionSetState.java:107-121 — stacking + level != UNDEFINED writes
    // the state channel AT that level (per-level stateStacks), not the scalar.
    if (this.levelIndex >= 0) {
      return state.withStateAtLevel(this.toIndex, this.levelIndex, this.stateValue);
    }
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
