/**
 * (set Count <n> to:<region>) start rule — seeds `n` pieces into every site of
 * the region (mancala: 4 seeds per hole). @java game/rules/start/set/sites/SetCount.java
 */
import type { IntFunction, RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import type { SiteType } from "../../../../action/site-type.js";

export class SetCountStart implements StartRule {
  private readonly countFn: IntFunction;
  private readonly type: SiteType | null;
  private readonly siteFn: IntFunction | null;
  private readonly regionFn: RegionFunction | null;

  public constructor(
    count: IntFunction,
    type: SiteType | null,
    site: IntFunction | null,
    region: RegionFunction | null,
  ) {
    this.countFn = count;
    this.type = type ?? null;
    this.siteFn = site ?? null;
    this.regionFn = region ?? null;
  }

  /**
   * @java game/rules/start/set/sites/SetCount.java — eval(Context)
   *
   * Java: ActionSetCount(type, site, what, count).apply(context) per site.
   * Until State convergence, mutates the start arrays the bridge context
   * carries (Game1to1.applyStartRule attaches them as ctx._startArrays).
   */
  public eval(ctx: Context): void {
    const arrays = (ctx as unknown as { _startArrays?: { countAt: number[] } })._startArrays;
    if (!arrays) return;
    const { countAt } = arrays;
    const sites = this.evalSites(ctx);
    const count = this.countFn.eval(ctx);
    // NOTE: do NOT set whats[site] for mancala (count-based) seeding.
    // In mancala, emptiness is determined by countAt=0, not by whats.
    // @java ContainerState.isEmpty(site) for mancala returns count(site)==0
    void this.type;
    for (const site of sites) {
      if (site < 0 || site >= countAt.length) continue;
      countAt[site] = count;
    }
  }

  private evalSites(ctx: Context): number[] {
    try {
      if (this.siteFn !== null) {
        const site = this.siteFn.eval(ctx);
        return site >= 0 ? [site] : [];
      }
      return this.regionFn?.eval(ctx) ?? [];
    } catch {
      return [];
    }
  }
}
