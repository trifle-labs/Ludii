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
    // @java Core/src/other/state/stacking/ContainerStateStacks.java:490-555
    // setSite(level==UNDEFINED) — Java's stacking container has a SINGLE
    // per-level chunk representation (no separate flat/per-level split);
    // `chunkStacks[site].setValue(...)` always updates the top chunk in
    // place, so the "current value" of a site is never split across two
    // channels. TS's hybrid valueAt[] (flat) / valueStacks[] (per-level,
    // materialized lazily — see state.ts withValueStackRow/valueTop) must
    // therefore be kept in lockstep: once a per-level row exists at this
    // site, its TOP entry IS the authoritative current value, exactly like
    // withStackPop already re-splices valueStacks alongside stacks/whatStacks
    // (state.ts:1300-1310) to avoid the same class of desync. Without this,
    // a flat-only write here leaves a stale top-of-stack entry that a later
    // per-level read (state.valueTop()/valueAtLevel(), used by e.g.
    // ValuePiece.eval() and any subsequent same-site relocation's carry
    // logic in action-move.ts) will see instead of the value just set here.
    const vs = state.valueStacks?.[this.toIndex];
    if (vs !== undefined && vs.length > 0) {
      const row = [...vs];
      row[row.length - 1] = this.valueValue;
      state = state.withValueStackRow(this.toIndex, row);
    }
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
