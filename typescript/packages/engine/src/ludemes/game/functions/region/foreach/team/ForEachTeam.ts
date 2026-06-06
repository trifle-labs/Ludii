// @java Core/src/game/functions/region/foreach/team/ForEachTeam.java

/**
 * Iterates through the teams, generating a region based on the sites
 * returned for each team.
 *
 * @java game/functions/region/foreach/team/ForEachTeam.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Iterates through teams, setting context.team for each non-empty team and
 * collecting unique sites from a region function.
 * @java game.functions.region.foreach.team.ForEachTeam
 */
export class ForEachTeam extends BaseRegionFunction {
  /** @java ForEachTeam — private final RegionFunction region */
  private readonly region: RegionFunction;

  /**
   * @java ForEachTeam(RegionFunction)
   * @param region The region to evaluate for each team.
   */
  public constructor(region: RegionFunction) {
    super();
    this.region = region;
  }

  /**
   * @java ForEachTeam.eval(Context)
   * Iterates through team ids (1..numPlayers). For each team that is non-empty,
   * sets context.team and collects unique sites from region.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const returnSites: number[] = [];
    // @java ForEachTeam.java:43 — save current team
    const ctxAny = ctx as unknown as {
      _evalTeam?: number[];
      state: {
        playerInTeam?(pid: number, tid: number): boolean;
      };
    };
    const savedTeam = ctxAny._evalTeam;

    // @java ForEachTeam.java:45-65 — iterate over team ids
    for (let tid = 1; tid < ctx.game.numPlayers + 1; tid++) {
      const team: number[] = [];
      // @java ForEachTeam.java:48-52 — collect players in this team
      for (let pid = 1; pid < ctx.game.numPlayers + 1; pid++) {
        if (ctxAny.state.playerInTeam?.(pid, tid)) {
          team.push(pid);
        }
      }
      // @java ForEachTeam.java:53-60 — if non-empty team, set team and eval region
      if (team.length > 0) {
        ctxAny._evalTeam = team;
        const sites = this.region.eval(ctx);
        for (const site of sites) {
          if (!returnSites.includes(site)) {
            returnSites.push(site);
          }
        }
      }
    }

    // @java ForEachTeam.java:62 — restore saved team
    ctxAny._evalTeam = savedTeam;
    return returnSites;
  }

  /** @java ForEachTeam.isStatic() */
  public override isStatic(): boolean {
    const regStatic = (this.region as unknown as { isStatic?: () => boolean }).isStatic;
    return typeof regStatic !== "function" || regStatic.call(this.region);
  }
}
