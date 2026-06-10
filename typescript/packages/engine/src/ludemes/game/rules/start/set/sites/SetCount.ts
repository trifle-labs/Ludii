/**
 * Sets the count at a site or region.
 *
 * @java game/rules/start/set/sites/SetCount.java — eval(Context)
 */

import type { EquipmentSurface } from "../../../../equipment/EquipmentSurface.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/sites/SetCount.java
 *
 * Mirrors Java SetCount.eval(Context): resolves the region to an array of site
 * indices and sets the count at each site to the given value.
 * Java additionally sets the `what` to the last component's index; we mirror that.
 */
export class SetCount implements StartRule {
  /** Site indices where the count will be set. */
  private readonly sites: readonly number[];

  /** The count value to set at each site. */
  private readonly count: number;

  /**
   * @param sites  site indices to set count on
   * @param count  the count value
   */
  public constructor(sites: readonly number[], count: number) {
    this.sites = sites;
    this.count = count;
  }

  /**
   * @java game/rules/start/set/sites/SetCount.java — eval(Context)
   *
   * Java: if (context.components().length == 1) → error, return.
   * Then: what = context.components()[context.components().length - 1].index()
   * Then: new ActionSetCount(type, loc, what, countFn.eval(context))
   *
   * In TS: pick the last registered piece as `what`, set countAt[site].
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as { _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void; setScore(pid: number, score: number): void; setAmount(pid: number, amount: number): void } })._startState;
    if (!cs) return;
    const equipment = (ctx.game as unknown as { equipment: EquipmentSurface }).equipment;
    // Java: uses context.components()[length-1].index() as `what`
    const pieces = equipment.pieces;
    if (pieces.length === 0) return;
    const lastPiece = pieces[pieces.length - 1]!;
    const what = lastPiece.index;

    for (const site of this.sites) {
      // Java: ActionSetCount sets who + what + count -> ContainerState.setSite(...)
      cs.setSite(site, lastPiece.owner, what, this.count, -1, -1);
    }
  }
}
