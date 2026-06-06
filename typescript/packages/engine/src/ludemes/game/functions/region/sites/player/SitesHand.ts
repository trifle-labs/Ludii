// @java Core/src/game/functions/region/sites/player/SitesHand.java

/**
 * Returns all the sites in a specific hand.
 *
 * @java game/functions/region/sites/player/SitesHand.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/** Mirror of Java RoleType values used by SitesHand. */
type RoleType = "Mover" | "Next" | "Shared" | "P1" | "P2" | "P3" | "P4" | string;

/**
 * Returns all the sites in a specific hand.
 *
 * @java game/functions/region/sites/player/SitesHand.java
 */
export class SitesHand extends BaseRegionFunction {
  /** @java SitesHand — index (player IntFunction from RoleType or Player) */
  private readonly index: IntFunction | null;

  /** @java SitesHand — role (RoleType for Shared handling) */
  private readonly role: RoleType | null;

  /**
   * @param index  The player index function (from RoleType.toIntFunction or player.index()).
   * @param role   The RoleType (for Shared special handling).
   * @java SitesHand constructor
   */
  public constructor(index: IntFunction | null, role: RoleType | null) {
    super();
    this.index = index;
    this.role = role;
  }

  /**
   * Returns all the sites in the hand of the specified player.
   *
   * @java SitesHand.eval(Context)
   *
   * Java parity:
   *   1. If precomputed, return it.
   *   2. If index is null, return empty region.
   *   3. Evaluate pid = index.eval(context).
   *   4. Validate pid in [1, numPlayers].
   *   5. Iterate containers; find the first Hand container owned by pid (or Shared).
   *   6. Build site array: sitesFrom[id] + i for each i in 0..numSites-1.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    if (this.index === null) {
      return [];
    }

    const pid = this.index.eval(ctx);
    const g = ctx.game as unknown as Game1to1;
    const numPlayers = g.numPlayers;

    // @java SitesHand — validate pid
    if (pid < 1 || pid > numPlayers) {
      return [];
    }

    // @java SitesHand — find hand container for this player
    const base = g.equipment?.handSiteFor?.(pid, 0);
    if (base === undefined || base < 0) return [];

    // @java SitesHand — return all sites in the hand container
    const hand = g.equipment?.hands?.find?.((hs: { owner: number; size: number }) => hs.owner === pid);
    const size = hand?.size ?? 1;

    const sites: number[] = [];
    for (let i = 0; i < size; i++) {
      sites.push(base + i);
    }
    return sites;
  }

  /** @java SitesHand.isStatic() */
  public override isStatic(): boolean {
    if (this.index !== null) {
      return (this.index as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    }
    return true;
  }

  /** @java SitesHand.isHand() — returns true */
  public override isHand(): boolean {
    return true;
  }

  /** @java SitesHand.toString() */
  public override toString(): string {
    return "Hand()";
  }
}
