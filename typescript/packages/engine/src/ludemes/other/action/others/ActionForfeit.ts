// @java Core/src/other/action/others/ActionForfeit.java ActionForfeit
/**
 * Forfeits a player.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionForfeit.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

/** Mirror of game.types.play.RoleType (minimal string union for the action). */
export type RoleType = string;

export class ActionForfeit extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly player: RoleType;
  // -------------------------------------------------------------------------

  constructor(playerOrDetailed: RoleType | string) {
    super();
    if (playerOrDetailed.startsWith("[Forfeit:")) {
      const ds = playerOrDetailed;
      this.player = extractData(ds, "player");
      this.decision = true;
    } else {
      this.player = playerOrDetailed;
    }
  }

  // -------------------------------------------------------------------------

  apply(context: LudiiContext, _store: boolean): Action {
    // Forfeit causes the player to lose immediately.
    // In the full engine this triggers End evaluation; we call the context helper.
    if (typeof context.forfeit === "function") {
      context.forfeit(this.player);
    }
    return this;
  }

  undo(_context: LudiiContext, _discard: boolean): Action { return this; }

  // -------------------------------------------------------------------------

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Forfeit:";
    sb += "player=" + this.player;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Forfeit"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Forfeit " + this.player;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Forfeit " + this.player + ")";
  }

  override isForfeit(): boolean { return true; }

  override actionType(): ActionType { return "Forfeit"; }
}
