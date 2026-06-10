// @java Core/src/game/functions/booleans/math/If.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (if <cond> <ok> [<notOk>]) — boolean if
 *
 * If cond is true, returns ok.eval(); if cond is false, returns notOk.eval()
 * (or false if notOk is null).
 *
 * @java game/functions/booleans/math/If.java
 */
export class IfBool implements BooleanFunction {
  /** @java If.cond */
  private readonly cond: BooleanFunction;
  /** @java If.ok */
  private readonly ok: BooleanFunction;
  /** @java If.notOk — may be null */
  private readonly notOk: BooleanFunction | null;

  public constructor(
    cond: BooleanFunction,
    ok: BooleanFunction,
    notOk: BooleanFunction | null,
  ) {
    this.cond = cond;
    this.ok = ok;
    this.notOk = notOk;
  }

  /**
   * @java game/functions/booleans/math/If.java — eval(Context):
   *   if (cond.eval) return ok.eval; if (notOk != null) return notOk.eval; return false
   */
  public eval(ctx: Context): boolean {
    if (this.cond.eval(ctx)) return this.ok.eval(ctx);
    if (this.notOk !== null) return this.notOk.eval(ctx);
    return false;
  }
}

