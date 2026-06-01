/**
 * @java game/functions/region/sites/player/SitesHand.java
 *
 * (sites Hand Mover) / (sites Hand P1) / (sites Hand Shared) etc.
 *
 * Returns the hand site indices for the given player role.
 *
 * Java parity: iterates containers, returns sites of Hand containers
 * owned by the given player (or Shared).
 *
 * TS simplification: returns [equipment.handSiteFor(playerId, 0..size-1)].
 *
 * @java game/functions/region/sites/player/SitesHand.java — eval(Context)
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { RoleType } from "../../../../../base.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

export class SitesHand1to1 implements RegionFunction {
  /** The role whose hand sites to return. */
  private readonly role: RoleType | "Shared";

  public constructor(role: RoleType | "Shared") {
    this.role = role;
  }

  /**
   * @java game/functions/region/sites/player/SitesHand.java — eval(Context)
   *
   * Returns the hand sites for the given player.
   */
  public eval(ctx: Context): number[] {
    const state = ctx.state;
    const game = ctx.game as unknown as Game1to1;
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

    const sites: number[] = [];
    const base = game.equipment.handSiteFor(playerId, 0);
    if (base < 0) return sites;

    // Find the hand spec for this player.
    const hand = game.equipment.hands.find(hs => hs.owner === playerId);
    const size = hand?.size ?? 1;
    for (let i = 0; i < size; i++) {
      sites.push(base + i);
    }
    return sites;
  }
}
