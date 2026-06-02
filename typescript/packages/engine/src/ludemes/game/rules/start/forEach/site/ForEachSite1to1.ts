/**
 * @java game/rules/start/forEach/site/ForEachSite.java
 *
 * Applies a start rule for each site in a region that satisfies an optional
 * Boolean condition.
 *
 * Java eval() sets context.setSite(site) before calling startRule.eval().
 * The inner start rule is called via applyToInitialState; inner rules that
 * read (site) via ctx._evalSite are documented as a deferred limitation.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { BooleanFunction, RegionFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";
import type { Context } from "../../../../../../context.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/** Always-true boolean constant. */
const TRUE_FN: BooleanFunction = { eval: () => true };

/**
 * @java game/rules/start/forEach/site/ForEachSite.java
 */
export class ForEachSite1to1 implements StartRule {
  /** @java ForEachSite.region */
  private readonly region: RegionFunction;

  /** @java ForEachSite.condition — defaults to BooleanConstant(true) */
  private readonly condition: BooleanFunction;

  /** @java ForEachSite.startRule */
  private readonly startRule: StartRule;

  /**
   * @java ForEachSite(RegionFunction, BooleanFunction, StartRule)
   * @param regionFn     The region to iterate.
   * @param condition    Filter condition; null → always true.
   * @param startRule    The rule to apply per site.
   */
  public constructor(
    regionFn: RegionFunction,
    condition: BooleanFunction | null,
    startRule: StartRule,
  ) {
    this.region = regionFn;
    this.condition = condition ?? TRUE_FN;
    this.startRule = startRule;
  }

  /**
   * @java ForEachSite.eval(Context)
   *
   * Iterates sites from the region. For each site passing the condition,
   * calls startRule.applyToInitialState. The current site is exposed on
   * the fake context as _evalSite for the condition evaluation; inner
   * start rules that need _evalSite see it only if they use the same
   * fake context (see limitation note in class doc).
   */
  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    const fakeCtx = makeFakeCtx(cells, equipment, numPlayers);

    // Java: final TIntArrayList sites = new TIntArrayList(region.eval(context).sites());
    let sites: number[];
    try {
      sites = this.region.eval(fakeCtx);
    } catch {
      return;
    }

    // Java: final int originSiteValue = context.site(); context.setSite(site);
    for (const site of sites) {
      fakeCtx._evalSite = site;
      // Java: if (condition.eval(context)) startRule.eval(context);
      let pass = true;
      try {
        pass = this.condition.eval(fakeCtx);
      } catch {
        pass = false;
      }
      if (pass) {
        this.startRule.applyToInitialState(cells, whats, countAt, equipment, numPlayers);
      }
    }
    // Java: context.setSite(originSiteValue); (restored — fake ctx is discarded)
  }
}

/** Minimal fake context for region/condition evaluation. */
function makeFakeCtx(
  cells: number[],
  equipment: Equipment1to1,
  numPlayers: number,
): Context & { _evalSite: number } {
  const fakeGame = { numPlayers, equipment } as unknown as Game1to1;
  return {
    game: fakeGame,
    state: {
      mover: 1,
      cells,
      isEmptySite: (i: number) => !cells[i],
    },
    _evalFrom: -1,
    _evalTo: -1,
    _evalValue: 0,
    _evalSite: -1,
    _evalPlayer: 1,
    _radials: equipment.board.radials,
  } as unknown as Context & { _evalSite: number };
}
