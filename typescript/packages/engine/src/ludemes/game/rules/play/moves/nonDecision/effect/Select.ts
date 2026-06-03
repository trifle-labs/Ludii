// @java Core/src/game/rules/play/moves/nonDecision/effect/Select.java

/**
 * Selects either a site or a pair of "from" and "to" locations.
 *
 * @java game/rules/play/moves/nonDecision/effect/Select.java
 *
 * Java: public final class Select extends Effect
 *   - region: IntArrayFromRegion — from-sites region
 *   - condition: BooleanFunction — from-site condition
 *   - regionTo: IntArrayFromRegion | null — optional to-sites region
 *   - conditionTo: BooleanFunction — to-site condition
 *   - typeFrom / typeTo: SiteType
 *   - levelFromFn / levelToFn: IntFunction | null
 *   - mover: RoleType | null
 *
 * eval(): for each site in the from-region that satisfies `condition`,
 * emit ActionSelect moves. If a `to` region is specified, pair each
 * from-site with each to-site that satisfies `conditionTo`.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionSelect } from "../../../../../../../action/action-select.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";

/**
 * Select effect — emits ActionSelect for each valid from/to site pair.
 *
 * @java game/rules/play/moves/nonDecision/effect/Select.java
 */
export class Select extends Effect {
  /** @java Select.region — from-sites region */
  private readonly region: RegionFunction;

  /** @java Select.condition — from-site filter */
  private readonly condition: BooleanFunction;

  /** @java Select.regionTo — optional to-sites region */
  private readonly regionTo: RegionFunction | null;

  /** @java Select.conditionTo — to-site filter */
  private readonly conditionTo: BooleanFunction;

  /** @java Select.levelFromFn */
  private readonly levelFromFn: IntFunction | null;

  /** @java Select.levelToFn */
  private readonly levelToFn: IntFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Select.java — constructor
   */
  public constructor(opts: {
    region: RegionFunction;
    condition: BooleanFunction;
    regionTo?: RegionFunction | null;
    conditionTo?: BooleanFunction | null;
    levelFromFn?: IntFunction | null;
    levelToFn?: IntFunction | null;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.region = opts.region;
    this.condition = opts.condition;
    this.regionTo = opts.regionTo ?? null;
    this.conditionTo = opts.conditionTo ?? { eval: () => true };
    this.levelFromFn = opts.levelFromFn ?? null;
    this.levelToFn = opts.levelToFn ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Select.java — eval(Context)
   *
   * Java lines 119-228:
   *   1. Iterate sites in region.
   *   2. For each site: set context.from = context.to = site, check condition.
   *   3. If no regionTo: emit single ActionSelect(site, site).
   *   4. If regionTo: for each to-site, check conditionTo, emit ActionSelect(site, to).
   */
  public override eval(ctx: Context): Move[] {
    const sites = this.region.eval(ctx);
    const mover = ctx.state.mover;

    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;

    const result: Move[] = [];

    for (const site of sites) {
      if (site < 0) continue;

      // @java Select.java:153-154
      (ctx as unknown as { _evalFrom?: number })._evalFrom = site;
      (ctx as unknown as { _evalTo?: number })._evalTo = site;

      if (!this.condition.eval(ctx)) continue;

      if (this.regionTo === null) {
        // @java Select.java:159-168 — single-site select
        result.push(new Move({
          id: `select:${mover}:${site}:${site}`,
          label: `Select(${site})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [new ActionSelect(site, site)],
        }));
      } else {
        // @java Select.java:172-215 — from + to select
        const sitesTo = this.regionTo.eval(ctx);
        for (const siteTo of sitesTo) {
          if (siteTo < 0) continue;
          (ctx as unknown as { _evalTo?: number })._evalTo = siteTo;
          if (!this.conditionTo.eval(ctx)) continue;

          result.push(new Move({
            id: `select:${mover}:${site}:${siteTo}`,
            label: `Select(${site}→${siteTo})`,
            siteIndices: [site, siteTo],
            mover,
            placedOwner: mover,
            actions: [new ActionSelect(site, siteTo)],
          }));
        }
      }
    }

    // Restore context scratch
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Select.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
