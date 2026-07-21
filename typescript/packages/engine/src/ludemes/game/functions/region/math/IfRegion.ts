// @java Core/src/game/functions/region/math/If.java

/**
 * Returns one of two regions depending on a condition.
 *
 * @java game/functions/region/math/If.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

export class If extends BaseRegionFunction {
  /** @java If.condition */
  private readonly condition: BooleanFunction;
  /** @java If.ok */
  private readonly ok: RegionFunction;
  /** @java If.notOk */
  private readonly notOk: RegionFunction | null;

  /** @java If(BooleanFunction cond, RegionFunction ok, @Opt RegionFunction notOk) */
  public constructor(cond: BooleanFunction, ok: RegionFunction, notOk: RegionFunction | null = null) {
    super();
    this.condition = cond;
    this.ok = ok;
    this.notOk = notOk;
  }

  /** @java If.eval(Context) — cond ? ok : (notOk ?? empty) */
  public override eval(ctx: Context): number[] {
    if (this.condition.eval(ctx)) return this.ok.eval(ctx);
    if (this.notOk !== null) return this.notOk.eval(ctx);
    return [];
  }

  /** @java If.isStatic() */
  public override isStatic(): boolean { return false; }
}
