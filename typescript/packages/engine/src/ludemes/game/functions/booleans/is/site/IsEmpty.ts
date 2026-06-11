// @java Core/src/game/functions/booleans/is/site/IsEmpty.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";

/**
 * (is Empty <site>)
 * Checks if a site is empty (no piece placed there).
 * @java game/functions/booleans/is/site/IsEmpty.java
 */
export class IsEmpty implements BooleanFunction {
  /** @java IsEmpty.type */
  private readonly type: SiteType | null;

  /** @java IsEmpty.siteFn */
  private readonly siteFn: IntFunction;

  public constructor(type: SiteType | null | undefined, siteFn: IntFunction) {
    this.type = type ?? null;
    this.siteFn = siteFn;
  }

  /**
   * @java game/functions/booleans/is/site/IsEmpty.java — eval(Context):
   *   site < 0 → false; cs.isEmpty(site, type)
   */
  public eval(ctx: Context): boolean {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return false;
    // @java cs.isEmpty(site, type) — an EXPLICIT type with a typed channel
    // reads that channel (Guerrilla's (is Empty Cell (to)) on a Vertex board).
    if (this.type !== null) {
      const typed = (ctx.state as unknown as { typedSites?: ReadonlyMap<string, { who: readonly number[]; count: readonly number[] }> }).typedSites;
      const ch = typed?.get(this.type);
      if (ch) return (ch.who[site] ?? 0) === 0 && (ch.count[site] ?? 0) === 0;
    }
    return ctx.state.isEmptySite(site);
  }
}

