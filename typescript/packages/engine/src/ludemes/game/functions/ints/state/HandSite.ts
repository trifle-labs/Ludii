/**
 * @java game/functions/ints/board/HandSite.java
 *
 * (handSite Mover) / (handSite P1) / (handSite Shared) etc.
 *
 * Returns the site index of the given player's hand slot (offset 0 by default).
 *
 * Java parity: HandSite.eval(context) resolves the role to a player id,
 * then returns equipment.sitesFrom()[containerId] + offset.
 *
 * In the 1:1 TS path: equipment.handSiteFor(playerId, offset).
 *
 * @java game/functions/ints/board/HandSite.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";
import type { Game } from "../../../../Game.js";

export class HandSite implements IntFunction {
  /** Player role. @java HandSite.role */
  private readonly role: RoleType | "Shared";
  /** Slot offset within the hand. @java HandSite.index */
  private readonly offset: number;

  /**
   * @java game/functions/ints/board/HandSite.java — constructor
   */
  public constructor(role: RoleType | "Shared", offset = 0) {
    this.role = role;
    this.offset = offset;
  }

  /**
   * @java game/functions/ints/board/HandSite.java — eval(Context)
   */
  public eval(ctx: Context): number {
    const game = ctx.game as unknown as Game;
    const state = ctx.state;
    const numPlayers = game.numPlayers;

    let playerId: number;
    switch (this.role) {
      case "Mover":
        playerId = state.mover;
        break;
      case "Next":
        playerId = (state.mover % numPlayers) + 1;
        break;
      case "Shared":
        playerId = 0;
        break;
      default: {
        const n = parseInt((this.role as string).slice(1), 10);
        playerId = isNaN(n) ? state.mover : n;
        break;
      }
    }

    return game.equipment.handSiteFor(playerId, this.offset);
  }
}
