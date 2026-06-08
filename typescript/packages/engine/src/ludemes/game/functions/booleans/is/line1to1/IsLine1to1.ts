/**
 * IsLine1to1.ts
 *
 * Registration bridge for the already-faithful IsLine class.
 * Registers IsLine into the bool registry so it's used by compiler1to1.ts.
 *
 * @java Core/src/game/functions/booleans/is/line/IsLine.java
 */

import { IsLine } from "../line/IsLine.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import type { IntFunction } from "../../../../../base.js";
import { IntConstant } from "../../../ints/IntConstant.js";

registerBool1to1("is:line", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Line", positional[1] = length int-fn, positional[2] = optional dirn
  const lenNode = positional[1];
  const len: IntFunction = lenNode ? compileInt1to1(lenNode) : new IntConstant(3);

  let dirnName = "Adjacent";
  const dirnNode = positional[2];
  if (dirnNode && isIdent(dirnNode)) {
    const dn = dirnNode.name;
    // Skip role-type idents (they are player specifiers, not directions)
    const roles = new Set(["mover", "next", "p1", "p2", "all", "each"]);
    if (!roles.has(dn.toLowerCase())) {
      dirnName = dn;
    }
  }

  // exact:True — line must be exactly len, not part of a longer line.
  // @java IsLine.exactLength — when true, count must equal len exactly.
  const exactNode = named.get("exact");
  const exact = exactNode !== undefined && isIdent(exactNode) &&
    exactNode.name.toLowerCase() === "true";

  return new IsLine(null, len, dirnName, null, null, null, null, null, exact);
});
