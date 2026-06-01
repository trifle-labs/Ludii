// @java Core/src/game/functions/booleans/is/graph/IsLastTo.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
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

registerBool1to1("is:lastto", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is LastTo <Cell|Vertex|Edge>)
  // positional[0] = "LastTo", positional[1] = SiteType ident
  const { positional } = parseArgs1to1((node as LudList).items);
  const typeNode = positional[1];
  let siteType: SiteType = "Cell";
  if (typeNode && isIdent(typeNode)) {
    const name = typeNode.name;
    if (name === "Cell" || name === "Vertex" || name === "Edge") {
      siteType = name as SiteType;
    }
  }
  return new IsLastTo1to1(siteType);
});
