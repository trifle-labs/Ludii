// @java Core/src/other/action/move/ActionPromote.java ActionPromote
/** Java parity: Core/src/other/action/move/ActionPromote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

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
    return state.withCell(this.toIndex, this.whoValue).withWhatAt(this.toIndex, this.whatValue);
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
