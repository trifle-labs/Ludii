/**
 * (set Count <n> to:<region>) start rule — seeds `n` pieces into every site of
 * the region (mancala: 4 seeds per hole). @java game/rules/start/set/sites/SetCount.java
 */
import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import type { Game1to1 } from "../../../Game1to1.js";

export class SetCountStart1to1 implements StartRule {
  private readonly regionFn: RegionFunction;
  private readonly count: number;
  /** Optional seed component index (the "Seed"/neutral piece) to set as `what`. */
  private readonly what: number;

  public constructor(regionFn: RegionFunction, count: number, what = 0) {
    this.regionFn = regionFn;
    this.count = count;
    this.what = what;
  }

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    const sites = this.evalRegion(equipment, numPlayers);
    for (const site of sites) {
      if (site < 0 || site >= countAt.length) continue;
      countAt[site] = this.count;
      if (this.what > 0) { whats[site] = this.what; }
    }
    void cells;
  }

  private evalRegion(equipment: Equipment1to1, numPlayers: number): number[] {
    const fakeGame = { numPlayers, equipment } as unknown as Game1to1;
    const fakeCtx = {
      game: fakeGame,
      state: { mover: 1, cells: new Array(equipment.totalSites).fill(0), isEmptySite: () => true },
      _evalFrom: -1, _evalTo: -1, _evalValue: 0,
      _radials: equipment.board.radials,
    } as unknown as Context;
    try { return this.regionFn.eval(fakeCtx); } catch { return []; }
  }
}
