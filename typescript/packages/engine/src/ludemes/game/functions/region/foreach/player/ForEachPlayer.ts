// @java Core/src/game/functions/region/foreach/player/ForEachPlayer.java

/**
 * Iterates through the players, generating a region based on the sites
 * returned for each player.
 *
 * @java game/functions/region/foreach/player/ForEachPlayer.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction, IntArrayFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Iterates through the players, collecting sites from a region function
 * evaluated for each player.
 * @java game.functions.region.foreach.player.ForEachPlayer
 */
export class ForEachPlayer extends BaseRegionFunction {
  /** @java ForEachPlayer — private final RegionFunction region */
  private readonly region: RegionFunction;
  /** @java ForEachPlayer — private final IntArrayFunction playersFn */
  private readonly playersFn: IntArrayFunction | null;

  /**
   * @java ForEachPlayer(IntArrayFunction, RegionFunction)
   * @param playersFn Optional explicit player list; null to iterate all players.
   * @param region    Region evaluated for each player.
   */
  public constructor(
    playersFn: IntArrayFunction | null,
    region: RegionFunction,
  ) {
    super();
    this.playersFn = playersFn;
    this.region = region;
  }

  /**
   * @java ForEachPlayer.eval(Context)
   * Iterates through players (all, or the explicit list), sets context.player
   * for each, collects unique sites from the region function, then restores.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const returnSites: number[] = [];
    // @java ForEachPlayer.java:52 — save current player
    const savedPlayer = ctx._evalPlayer;

    if (this.playersFn === null) {
      // @java ForEachPlayer.java:54-62 — iterate all players
      for (let pid = 1; pid < ctx.game.numPlayers + 1; pid++) {
        ctx._evalPlayer = pid;
        const sites = this.region.eval(ctx);
        for (const site of sites) {
          if (!returnSites.includes(site)) {
            returnSites.push(site);
          }
        }
      }
    } else {
      // @java ForEachPlayer.java:64-80 — iterate explicit player list
      const players = this.playersFn.eval(ctx);
      for (let i = 0; i < players.length; i++) {
        const pid = players[i]!;
        if (pid < 0 || pid > ctx.game.numPlayers) continue;
        ctx._evalPlayer = pid;
        const sites = this.region.eval(ctx);
        for (const site of sites) {
          if (!returnSites.includes(site)) {
            returnSites.push(site);
          }
        }
      }
    }

    // @java ForEachPlayer.java:83 — restore saved player
    ctx._evalPlayer = savedPlayer;
    return returnSites;
  }

  /** @java ForEachPlayer.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
