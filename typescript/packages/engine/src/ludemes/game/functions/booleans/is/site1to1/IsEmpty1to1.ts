// @java Core/src/game/functions/booleans/is/site/IsEmpty.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Empty <site>)
 * Checks if a site is empty (no piece placed there).
 * @java game/functions/booleans/is/site/IsEmpty.java
 */
export class IsEmpty1to1 implements BooleanFunction {
  /** @java IsEmpty.siteFn */
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /**
   * @java game/functions/booleans/is/site/IsEmpty.java — eval(Context):
   *   site < 0 → false; cs.isEmpty(site, type)
   */
  public eval(ctx: Context): boolean {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return false;
    return ctx.state.isEmptySite(site);
  }
}

registerBool1to1("is:empty", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is Empty [SiteType] <site>)
  // positional[0] = "Empty" ident, positional[1] = optional SiteType or site
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] is the "Empty" subtype ident
  // Skip optional SiteType (Cell/Edge/Vertex) idents
  let siteNode: LudNode | undefined;
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i]!;
    if (isIdent(p)) {
      const name = p.name;
      if (name === "Cell" || name === "Edge" || name === "Vertex") continue;
    }
    siteNode = p;
    break;
  }
  if (!siteNode) {
    // No explicit site: use context._evalTo (last placed site)
    return { eval(ctx: Context): boolean { return ctx.state.isEmptySite(ctx._evalTo); } };
  }
  const siteFn = compileInt1to1(siteNode);
  return new IsEmpty1to1(siteFn);
});
