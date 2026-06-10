// @java Core/src/game/functions/booleans/is/graph/IsLastFrom.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import type { SiteType } from "../../../../../../action/site-type.js";

/**
 * (is LastFrom <SiteType>)
 * Checks if the from-location of the last move is a specific graph element type.
 * @java game/functions/booleans/is/graph/IsLastFrom.java
 */
export class IsLastFrom1to1 implements BooleanFunction {
  /** @java IsLastFrom.type */
  private readonly type: SiteType;

  public constructor(type: SiteType) {
    this.type = type;
  }

  /**
   * @java IsLastFrom.eval(Context):
   *   context.trial().lastMove().fromType() == type
   */
  public eval(ctx: Context): boolean {
    const last = ctx.trial.lastMove();
    if (!last) return false;
    return last.fromType() === this.type;
  }
}

