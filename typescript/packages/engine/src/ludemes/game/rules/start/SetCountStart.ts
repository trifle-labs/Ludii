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
   * Writes through the bridge ContainerState mutation facade (ctx._startState).
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as {
      _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void };
    })._startState;
    if (!cs) return;
    const sites = this.evalSites(ctx);
    const count = this.countFn.eval(ctx);
    // @java SetCount.java:79 — what = the LAST component's index; pits hold
    // that component (Seed) while seeded, so ActionMove's same-what
    // accumulation test works on capture transfers (Kisolo compound capture).
    // Emptiness stays count-based (@java mancala isEmpty = count==0; the
    // AddCount drain clears what when count reaches 0).
    void this.type;
    const pieces = (ctx.game as unknown as { equipment?: { pieces?: Array<{ index: number }> } }).equipment?.pieces;
    const what = pieces && pieces.length > 0 ? pieces[pieces.length - 1]!.index : -1;
    for (const site of sites) {
      // @java ActionSetCount(type, loc, what, count) -> cs.setSite(site, UNDEF, what, count, ...)
      cs.setSite(site, -1, count > 0 ? what : -1, count, -1, -1);
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
