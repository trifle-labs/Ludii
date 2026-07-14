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
    const equipment = g.equipment as unknown as {
      playerRegions?: ReadonlyMap<number, { eval(c: unknown): number[] }>;
      namedPlayerRegions?: ReadonlyMap<string, ReadonlyMap<number, { eval(c: unknown): number[] }>>;
    } | undefined;

    // @java SitesEquipmentRegion.preprocess — regionsPerPlayer[p] collects the
    // equipment regions whose `region.name().contains(name)` for owner p;
    // eval(who) UNIONS regionsPerPlayer[who]. The name filter is essential:
    // Bao's `(sites Mover "Inner")` must select the per-player "Inner" rows,
    // not whatever region happens to be registered first for that owner.
    const named = equipment?.namedPlayerRegions;
    if (named && named.size > 0) {
      const needle = this.name.toLowerCase();
      const result: number[] = [];
      const seen = new Set<number>();
      let matchedName = false;
      for (const [regionName, byOwner] of named) {
        // @java SitesEquipmentRegion.java — TWO match modes: the
        // player-qualified path (index != null, :245) uses
        // region.name().contains(name) (substring); the bare-name path
        // (index == null, :280) uses region.name().equals(name) (EXACT).
        // Substring matching on the bare path bloated Los Escaques'
        // (sites "Section1") into Section1 ∪ Section10 ∪ Section11 (84 sites
        // instead of 28), sending SectionDistance down the wrong branch and
        // mis-scoring every relative-position award. Compare
        // case-insensitively on BOTH sides (Chameleons' "RedTiles" lesson).
        {
          const lc = regionName.toLowerCase();
          const matches = this.index !== null
            ? (needle === "" || lc.includes(needle))
            : (needle === "" || lc === needle);
          if (!matches) continue;
        }
        matchedName = true;
        // No player qualifier ((sites "RedTiles")) → union the name's
        // regions across ALL owners (@java preprocess collects per-owner;
        // a bare-name lookup has no owner to key on).
        const owners = this.index !== null ? [who] : [...byOwner.keys()];
        for (const ow of owners) {
          const fn = byOwner.get(ow);
          if (!fn) continue;
          for (const s of fn.eval(ctx)) {
            if (!seen.has(s)) { seen.add(s); result.push(s); }
          }
        }
      }
      if (matchedName || this.name !== "") return result;
    }

    // Unnamed-region fallback (regions registered without a usable name).
    const regionFn = equipment?.playerRegions?.get(who);
    if (regionFn) return regionFn.eval(ctx);

    if (equipment?.playerRegions) {
      const result: number[] = [];
      const seen = new Set<number>();
      for (const [pid, fn] of equipment.playerRegions) {
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
