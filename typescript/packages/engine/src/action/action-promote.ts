// @java Core/src/other/action/move/ActionPromote.java ActionPromote
/** Java parity: Core/src/other/action/move/ActionPromote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

function replaceRow(rows: readonly (readonly number[])[], idx: number, row: number[]): (readonly number[])[] {
  const next = rows.map((r) => [...r]);
  next[idx] = row;
  return next;
}

export class ActionPromote extends BaseAction {
  public static readonly TYPE: ActionType = "Promote";

  private readonly toIndex: number;
  private readonly whoValue: number;
  private readonly whatValue: number;

  /**
   * @param to    target site
   * @param who   new owner (Java: `context.components()[newWhat].owner()`)
   * @param what  new component `what` id; defaults to `who` when the caller
   *              only knows the owner (e.g. board-neutral `(move Promote)`),
   *              which leaves the site reading as its owner's primary piece.
   */
  public constructor(to: number, who: number, what: number = who) {
    super();
    this.toIndex = to;
    this.whoValue = who;
    this.whatValue = what;
  }

  public override apply(state: State): State {
    // Java ActionPromote.apply: clear the old piece, then setSite to
    // (who, newWhat). We set the owner (cells) and the component identity
    // (whats) so `(forEach Piece "Name")` dispatch recognises the new type
    // (e.g. a draughts man promoted to a flying king).
    let s2 = state.withCell(this.toIndex, this.whoValue).withWhatAt(this.toIndex, this.whatValue);
    // @java ActionPromote: owned remove(old comp at top level) + add(new).
    if (s2.ownedEntries !== undefined) {
      const lvl = Math.max(0, (s2.stacks[this.toIndex]?.length ?? 1) - 1);
      const oldWhat = state.whatAtSiteLevel(this.toIndex, lvl) || state.whatAtSite(this.toIndex);
      const oldOwner = (state.stacks[this.toIndex]?.length ?? 0) > 0 ? state.stackAt(this.toIndex, lvl) : state.who(this.toIndex);
      s2 = s2.withOwnedRemoveLevel(oldOwner, oldWhat, this.toIndex, lvl);
      s2 = s2.withOwnedAdd(this.whoValue > 0 ? this.whoValue : oldOwner, this.whatValue, this.toIndex, lvl);
    }
    // @java ActionPromote — FlatCellOnlyOwned remove-swap(old comp) +
    // add(new comp), same site (a promotion never changes location). See
    // ActionMove's parity block for the registry's provenance.
    if (s2.flatOwned !== undefined) {
      const oldWhat = state.whatAtSite(this.toIndex);
      const oldOwner = state.who(this.toIndex);
      if (oldOwner > 0) {
        s2 = s2.withFlatOwnedRemove(oldOwner, oldWhat || oldOwner, this.toIndex);
      }
      const newOwner = this.whoValue > 0 ? this.whoValue : oldOwner;
      if (newOwner > 0) {
        s2 = s2.withFlatOwnedAdd(newOwner, this.whatValue, this.toIndex);
      }
    }
    // @java ActionPromote on a stacking container promotes the TOP level
    // (cs.setSite(..., level)) — refresh the per-level what column too, or a
    // promoted commander (Bashni CounterStar) is invisible to the per-level
    // ForEachPiece scan and the top:True filter.
    //
    // @java ActionPromote.java:149-192 — when `game.isStacking()`, apply()
    // ALWAYS does a top-level remove()+addItemGeneric() (pop the old top,
    // push the new component), regardless of the stack's height: a
    // single-item stack (sizeStack==1, e.g. MensaSpiel's initial `(place
    // Stack "Starter2" … count:3)` seeding) still gets its per-level
    // whatStacks/stacks row refreshed. The prior `os.length > 1` guard only
    // refreshed genuine multi-level stacks, leaving a single-level site's
    // whatStacks entry stale after promotion (flat `whats[]` was correctly
    // written, but `whatAtSiteLevel` prefers the stale per-level entry once
    // materialized — see state.ts:869-894 — which then poisoned
    // `withOwnedMaterialized()`'s later scan of that site with the OLD
    // component, e.g. MensaSpiel Starter2→Cone2 leaving the owned registry
    // reading Starter2 forever after a same-turn promotion).
    const ws = (s2 as unknown as { whatStacks: readonly (readonly number[])[] }).whatStacks[this.toIndex];
    const os = (s2 as unknown as { stacks: readonly (readonly number[])[] }).stacks[this.toIndex];
    const rowLen = Math.max(os?.length ?? 0, ws?.length ?? 0);
    if (state.stackingGame && rowLen >= 1) {
      const top = rowLen - 1;
      const baseOwner = state.who(this.toIndex);
      const nextWs = (ws !== undefined && ws.length >= rowLen) ? [...ws] : [...(ws ?? []), ...new Array(rowLen - (ws?.length ?? 0)).fill(0)];
      nextWs[top] = this.whatValue;
      const nextOs = (os !== undefined && os.length >= rowLen) ? [...os] : [...(os ?? []), ...new Array(rowLen - (os?.length ?? 0)).fill(baseOwner)];
      if (this.whoValue > 0) nextOs[top] = this.whoValue;
      s2 = (s2 as unknown as { with(p: object): State }).with({ whatStacks: replaceRow((s2 as unknown as { whatStacks: readonly (readonly number[])[] }).whatStacks, this.toIndex, nextWs), stacks: replaceRow((s2 as unknown as { stacks: readonly (readonly number[])[] }).stacks, this.toIndex, nextOs) });
    }
    return s2;
  }
  public override actionType(): ActionType {
    return ActionPromote.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override what(): number {
    return this.whatValue;
  }
}
