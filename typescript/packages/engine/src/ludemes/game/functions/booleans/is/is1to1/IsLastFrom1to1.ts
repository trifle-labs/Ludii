// @java Core/src/game/functions/booleans/is/graph/IsLastFrom.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
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

registerBool1to1("is:lastfrom", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is LastFrom <Cell|Vertex|Edge>)
  // positional[0] = "LastFrom", positional[1] = SiteType ident
  const { positional } = parseArgs1to1((node as LudList).items);
  const typeNode = positional[1];
  let siteType: SiteType = "Cell";
  if (typeNode && isIdent(typeNode)) {
    const name = typeNode.name;
    if (name === "Cell" || name === "Vertex" || name === "Edge") {
      siteType = name as SiteType;
    }
  }
  return new IsLastFrom1to1(siteType);
});
