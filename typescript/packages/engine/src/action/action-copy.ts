// @java Core/src/other/action/move/ActionCopy.java ActionCopy
/** Java parity: Core/src/other/action/move/ActionCopy.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionCopy extends BaseAction {
  public static readonly TYPE: ActionType = "Copy";

  private readonly fromIndex: number;
  private readonly toIndex: number;

  public constructor(from: number, to: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
  }

  public override apply(state: State): State {
    // Java parity: ActionCopy places a copy of the source piece at `to`
    // while leaving the source completely unchanged.
    // Net effect: `to` carries the same owner and component as `from`; `from` is untouched.
    //
    // Unlike ActionMove, ActionCopy does NOT decrement hand counts.
    // We check `what` (component index) as well as `owner` for Shared pieces
    // which have owner=0 but a valid what.
    const owner = state.who(this.fromIndex);
    const what = state.whatAtSite(this.fromIndex);
    if (owner === 0 && what === 0) return state; // Truly empty source

    // @java ActionCopy.apply (ActionCopy.java:198, `final boolean
    // requiresStack = game.isStacking();`) branches on the GAME's stacking
    // flag, not a per-action marker: in a stacking game, Copy PUSHES a new
    // level onto `to` (Java's internal ActionMove.construct moves the source
    // top to `to`, then csA.addItemGeneric/insert republishes an identical
    // level back onto `from` — net effect: `from`'s stack height is
    // unchanged, `to` grows by exactly one level). The TS port always took
    // the flat withCell/withWhatAt path below regardless of
    // `state.stackingGame`, so a stacking-game Copy onto an already-occupied
    // destination overwrote its existing top piece instead of stacking a new
    // level on top of it (Dig Dig: MOVE_MISMATCH — the recorded Java move
    // grew the destination stack by one level; the flat TS write left the
    // stack height unchanged).
    if (state.stackingGame) {
      let stackNext = state.withStackPush(this.toIndex, owner, what);
      const srcState = state.stateAtSite(this.fromIndex);
      stackNext = stackNext.withStateAt(this.toIndex, srcState);
      const srcValue = state.valueAtSite(this.fromIndex);
      stackNext = stackNext.withValueAt(this.toIndex, srcValue);
      const srcRot = (state as unknown as { rotationAt?: readonly number[] }).rotationAt?.[this.fromIndex] ?? 0;
      const withRotStack = (stackNext as unknown as { withRotationAt?: (s: number, r: number) => State }).withRotationAt;
      if (withRotStack) stackNext = withRotStack.call(stackNext, this.toIndex, srcRot);
      return stackNext;
    }

    let next = state.withCell(this.toIndex, owner);
    if (what !== 0) next = next.withWhatAt(this.toIndex, what);
    // @java ActionCopy.java:195-196 -> ActionMove.apply — the copy carries
    // EVERY piece attribute from the source (state/rotation/value), not just
    // who/what. Or Thella's hand slot 1 carries state=1; dropping it made the
    // custodial capture's (!= (state at:between) (state at:lastTo)) compare
    // 0 vs 0 and the Do ifAfterwards filter rejected every from=65 placement
    // (the apparent copy-coord "+1 offset").
    //
    // The writes are UNCONDITIONAL: ActionMove sets the destination's
    // state/rotation/value straight from the source even when the source
    // value is 0 (csB.setSite copies csA's fields verbatim). Skipping the
    // write on srcState==0 left STALE destination state behind: Morra's
    // round-6 reveal copied a state-1 hand onto site 0, and the next round's
    // state-0 (zero fingers) copy silently kept state 1, so "SumFingers"
    // over-counted and neither player's (addScore …) fired on the final ply.
    const srcState = state.stateAtSite(this.fromIndex);
    next = next.withStateAt(this.toIndex, srcState);
    const srcValue = state.valueAtSite(this.fromIndex);
    next = next.withValueAt(this.toIndex, srcValue);
    const srcRot = (state as unknown as { rotationAt?: readonly number[] }).rotationAt?.[this.fromIndex] ?? 0;
    const withRot = (next as unknown as { withRotationAt?: (s: number, r: number) => State }).withRotationAt;
    if (withRot) next = withRot.call(next, this.toIndex, srcRot);
    return next;
  }
  public override actionType(): ActionType {
    return ActionCopy.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
}
