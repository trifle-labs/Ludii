// @java Core/src/game/rules/start/forEach/site/ForEachSite.java

/**
 * Applies a start rule for each site in a region that satisfies an optional
 * Boolean condition.
 *
 * @java game/rules/start/forEach/site/ForEachSite.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../../base.js";

/**
 * Minimal interface for a start rule that can be eval'd with a Context.
 * @java game/rules/start/StartRule.java — eval(Context)
 */
interface JavaStartRule {
  eval(context: Context): void;
}

/**
 * Applies a start rule for each site in a region, optionally filtered by a
 * Boolean condition. Before each iteration the context's site field is set to
 * the current site (@java Context.setSite(int)).
 *
 * @java game/rules/start/forEach/site/ForEachSite.java
 */
export class ForEachSite {
  /** @java ForEachSite.region */
  private readonly region: RegionFunction;

  /** @java ForEachSite.condition — defaults to BooleanConstant(true) */
  private readonly condition: BooleanFunction;

  /** @java ForEachSite.startRule */
  private readonly startRule: JavaStartRule;

  /**
   * @param regionFn     The original region.
   * @param condition    The condition to satisfy (null → always true).
   * @param startingRule The starting rule to apply.
   *
   * @java ForEachSite(RegionFunction, BooleanFunction, StartRule)
   */
  public constructor(
    regionFn: RegionFunction,
    condition: BooleanFunction | null,
    startingRule: JavaStartRule,
  ) {
    this.region = regionFn;
    // Java: this.condition = If == null ? new BooleanConstant(true) : If;
    this.condition = condition ?? { eval: () => true };
    this.startRule = startingRule;
  }

  /**
   * @java ForEachSite.eval(Context)
   *
   * Iterates the sites in the region. For each site passing the condition,
   * calls startRule.eval(context). Saves and restores context.site.
   */
  public eval(context: Context): void {
    // Java: final TIntArrayList sites = new TIntArrayList(region.eval(context).sites());
    const sites = this.region.eval(context as never);

    // Java: final int originSiteValue = context.site();
    const originSiteValue = (context as unknown as { _evalSite: number })._evalSite ?? -1;

    for (const site of sites) {
      // Java: context.setSite(site);
      (context as unknown as { _evalSite: number })._evalSite = site;

      // Java: if (condition.eval(context)) startRule.eval(context);
      if (this.condition.eval(context as never)) {
        this.startRule.eval(context);
      }
    }

    // Java: context.setSite(originSiteValue);
    (context as unknown as { _evalSite: number })._evalSite = originSiteValue;
  }

  /** @java ForEachSite.isStatic() */
  public isStatic(): boolean {
    return (
      (this.condition as unknown as { isStatic?(): boolean }).isStatic?.() !== false &&
      (this.region as unknown as { isStatic?(): boolean }).isStatic?.() !== false &&
      (this.startRule as unknown as { isStatic?(): boolean }).isStatic?.() !== false
    );
  }

  /** @java ForEachSite.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || ((this.condition as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    missing = missing || ((this.region as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    missing = missing || ((this.startRule as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ForEachSite.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let crash = false;
    crash = crash || ((this.condition as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    crash = crash || ((this.region as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    crash = crash || ((this.startRule as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    return crash;
  }

  /** @java ForEachSite.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.condition as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.region as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.startRule as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }
}
