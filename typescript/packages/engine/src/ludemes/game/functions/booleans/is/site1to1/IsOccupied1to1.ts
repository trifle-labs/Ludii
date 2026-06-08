// @java Core/src/game/functions/booleans/is/site/IsOccupied.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

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

registerBool1to1("is:occupied", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // Skip optional SiteType idents
  let type: SiteType | null = null;
  let siteNode: LudNode | undefined;
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i]!;
    if (isIdent(p)) {
      const name = p.name;
      if (name === "Cell" || name === "Edge" || name === "Vertex") {
        type = name;
        continue;
      }
    }
    siteNode = p;
    break;
  }
  if (!siteNode) {
    return { eval(ctx: Context): boolean { return !ctx.state.isEmptySite(ctx._evalTo); } };
  }
  const siteFn = compileInt1to1(siteNode);
  return new IsOccupied1to1(type, siteFn);
});
