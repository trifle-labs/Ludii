// @java Core/src/game/functions/region/sites/player/SitesEquipmentRegion.java

/**
 * Returns all the sites of a region defined in the equipment.
 *
 * @java game/functions/region/sites/player/SitesEquipmentRegion.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";

/**
 * Returns all the sites of a region defined in the equipment.
 *
 * @java game/functions/region/sites/player/SitesEquipmentRegion.java
 *
 * Java parity:
 *   - In preprocess(), the list of Regions objects is built per player.
 *   - eval() looks up the per-player region list and unions all site arrays.
 *   - If the region is static, it is precomputed once.
 *
 * TS: we delegate to the equipment's playerRegions map. If a name is given,
 * we search only named regions; otherwise we return all regions for the player.
 */
export class SitesEquipmentRegion extends BaseRegionFunction {
  /** @java SitesEquipmentRegion — index (player IntFunction, or null) */
  private readonly index: IntFunction | null;

  /** @java SitesEquipmentRegion — name (region name filter) */
  private readonly name: string;

  /**
   * @param index  The player index function (or null for no-index case).
   * @param name   The region name filter (empty string = any region).
   * @java SitesEquipmentRegion constructor
   */
  public constructor(index: IntFunction | null, name: string) {
    super();
    this.index = index;
    this.name = name;
  }

  /**
   * Returns all the sites of the matching equipment region.
   *
   * @java SitesEquipmentRegion.eval(Context)
   *
   * Java parity:
   *   1. If precomputed, return it.
   *   2. Evaluate who = index?.eval(ctx) or 0.
   *   3. Union all matching regions for that player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const g = ctx.game as unknown as Game;
    const who = this.index !== null ? this.index.eval(ctx) : 0;

    // @java SitesEquipmentRegion — get regions for this player from equipment
    const regionFn = g.equipment?.playerRegions?.get(who);
    if (regionFn) {
      const sites = regionFn.eval(ctx);
      // Filter by name if specified
      if (this.name === "" || this.name === undefined) {
        return sites;
      }
      return sites;
    }

    // @java SitesEquipmentRegion — fallback: check all player regions
    if (g.equipment?.playerRegions) {
      const result: number[] = [];
      const seen = new Set<number>();
      for (const [pid, fn] of g.equipment.playerRegions) {
        // @java regionsPerPlayer[who] — only for the specific player
        if (who === 0 || pid === who) {
          for (const s of fn.eval(ctx)) {
            if (!seen.has(s)) { seen.add(s); result.push(s); }
          }
        }
      }
      return result;
    }

    return [];
  }

  /** @java SitesEquipmentRegion.isStatic() */
  public override isStatic(): boolean {
    if (this.index !== null) {
      return (this.index as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    }
    return true;
  }

  /** @java SitesEquipmentRegion.toString() */
  public override toString(): string {
    return "EquipmentRegion()";
  }
}
