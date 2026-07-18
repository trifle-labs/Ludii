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
      // @java ActionCopy.java:195-221 — `actionMove.apply(...)` (the
      // underlying ActionMove/ActionMoveTopPiece push) already calls
      // `context.state().owned().add(who, what, to, sizeStack(to)-1, typeTo)`
      // as part of relocating the top piece onto `to`; this port's
      // `withStackPush` is that same push without the registry side effect,
      // so replicate it here at the new level (the pre-push height, matching
      // `sizeStack(to)-1` post-push) — the `from` side needs no registry
      // change (Java's own `owned().add(..., from, ...)` at line 215/220
      // merely restores what the intervening ActionMove.apply had removed;
      // net effect on `from`'s registration is a no-op).
      const preHeight = state.stackSize(this.toIndex);
      let stackNext = state.withStackPush(this.toIndex, owner, what);
      if (state.ownedEntries !== undefined && owner > 0) {
        stackNext = stackNext.withOwnedAdd(owner, what || owner, this.toIndex, preHeight);
      }
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
    // @java ActionCopy.java:195-204 — Java's `actionMove.apply(...)`
    // (the underlying ActionMove/ActionMoveTopPiece relocation the board
    // writes above stand in for) already performs the FlatCellOnlyOwned
    // bookkeeping for `to` as part of that relocation: remove any captured
    // piece's registration there, then append the mover's own. Replicate
    // that here (`from`'s registration is untouched — Java's own
    // `owned().add(..., from, ...)` at line 204 only restores what the
    // intervening move had removed, a net no-op). No-ops until a flat
    // board-to-board move first materializes the registry, same gating
    // convention as ActionAdd/ActionRemove.
    if (state.flatOwned !== undefined && owner > 0) {
      const capturedOwner = state.cellAt(this.toIndex).owner;
      const capturedWhat = state.whatAtSite(this.toIndex);
      if (capturedOwner > 0) {
        next = next.withFlatOwnedRemove(capturedOwner, capturedWhat || capturedOwner, this.toIndex);
      }
      next = next.withFlatOwnedAdd(owner, what || owner, this.toIndex);
    }
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
