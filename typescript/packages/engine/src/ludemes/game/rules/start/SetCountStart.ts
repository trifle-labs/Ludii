/**
 * (set Count <n> to:<region>) start rule — seeds `n` pieces into every site of
 * the region (mancala: 4 seeds per hole). @java game/rules/start/set/sites/SetCount.java
 */
import type { IntFunction, RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import { compileFlags } from "../../../../ludii/compiler/compile-flags.js";
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
    // @java SetCount.java:102 — gameFlags() = GameType.Count | … (unconditional).
    compileFlags.usesCount = true;
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
    //
    // @java type — SiteType (Cell/Vertex/Edge). Not used in TS because
    // site indices from regionFn/siteFn are already absolute (all site types
    // share a flat index space in the TS state arrays). The setSite() bridge
    // does not take a type parameter.
    const pieces = (ctx.game as unknown as { equipment?: { pieces?: Array<{ index: number; owner: number }> } }).equipment?.pieces;
    const lastPiece = pieces && pieces.length > 0 ? pieces[pieces.length - 1]! : null;
    const what = lastPiece ? lastPiece.index : -1;
    // @java ActionSetCount stamps the Seed component's OWNER as well as its
    // what/count (SetCount.ts already does this). Passing who=-1 left
    // cells[site]=0, so a SowAgainMove's ActionAdd accumulate-check
    // (currentWhat===what && currentOwner===owner) failed the owner half, took
    // the placement path and skipped the countAt update — NumToSow ran short
    // and the mover drifted (Dongjintian 4-player). Stamp the owner too.
    const who = lastPiece ? lastPiece.owner : -1;
    for (const site of sites) {
      // @java ActionSetCount(type, loc, what, count) -> cs.setSite(site, who, what, count, ...)
      cs.setSite(site, count > 0 ? who : -1, count > 0 ? what : -1, count, -1, -1);
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
