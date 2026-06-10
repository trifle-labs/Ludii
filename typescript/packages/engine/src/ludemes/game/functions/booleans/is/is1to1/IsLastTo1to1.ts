// @java Core/src/game/functions/booleans/is/graph/IsLastTo.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import type { SiteType } from "../../../../../../action/site-type.js";

/**
 * (is LastTo <SiteType>)
 * Checks if the to-location of the last move is a specific graph element type.
 * @java game/functions/booleans/is/graph/IsLastTo.java
 */
export class IsLastTo1to1 implements BooleanFunction {
  /** @java IsLastTo.type */
  private readonly type: SiteType;

  public constructor(type: SiteType) {
    this.type = type;
  }

  /**
   * @java IsLastTo.eval(Context):
   *   context.trial().lastMove().toType() == type
   */
  public eval(ctx: Context): boolean {
    const last = ctx.trial.lastMove();
    if (!last) return false;
    return last.toType() === this.type;
  }
}

