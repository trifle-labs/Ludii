// @java Core/src/game/functions/booleans/is/site/IsOccupied.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Occupied <site>)
 * Checks if a site is occupied (has a piece).
 * @java game/functions/booleans/is/site/IsOccupied.java
 */
export class IsOccupied1to1 implements BooleanFunction {
  /** @java IsOccupied.type */
  private readonly type: SiteType | null;

  /** @java IsOccupied.siteFn */
  private readonly siteFn: IntFunction;

  public constructor(type: SiteType | null | undefined, siteFn: IntFunction) {
    this.type = type ?? null;
    this.siteFn = siteFn;
  }

  /**
   * @java game/functions/booleans/is/site/IsOccupied.java — eval(Context):
   *   site < 0 → false; cs.what(site, type) != 0
   */
  public eval(ctx: Context): boolean {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return false;
    return !ctx.state.isEmptySite(site);
  }
}

