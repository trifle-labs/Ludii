/**
 * (set Count <n> to:<region>) start rule — seeds `n` pieces into every site of
 * the region (mancala: 4 seeds per hole). @java game/rules/start/set/sites/SetCount.java
 */
import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { IntFunction, RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import type { Game1to1 } from "../../../Game1to1.js";
import type { SiteType } from "../../../../action/site-type.js";

export class SetCountStart1to1 implements StartRule {
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

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    const ctx = this.fakeContext(equipment, numPlayers);
    const sites = this.evalSites(ctx);
    const count = this.countFn.eval(ctx);
    // NOTE: do NOT set whats[site] for mancala (count-based) seeding.
    // In mancala, emptiness is determined by countAt=0, not by whats.
    // Setting whats causes isEmptySite() to always return false for board
    // holes (even with 0 seeds), breaking (is Empty ...) predicates.
    // @java ContainerState.isEmpty(site) for mancala returns count(site)==0
    void whats;
    void cells;
    void this.type;
    for (const site of sites) {
      if (site < 0 || site >= countAt.length) continue;
      countAt[site] = count;
    }
  }

  private fakeContext(equipment: Equipment1to1, numPlayers: number): Context {
    const fakeGame = { numPlayers, equipment } as unknown as Game1to1;
    return {
      game: fakeGame,
      state: {
        mover: 1,
        cells: new Array(equipment.totalSites).fill(0),
        isEmptySite: () => true,
        vars: new Map<string, number>(),
        getVar: () => -1,
        remembered: new Map<string, readonly number[]>(),
        rememberedFor: () => [],
        pending: new Set<number>(),
        diceValues: [],
      },
      _evalFrom: -1, _evalTo: -1, _evalValue: 0,
      _radials: equipment.board.radials,
    } as unknown as Context;
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
