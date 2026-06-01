/**
 * NoMoves1to1.ts
 *
 * Registration bridge for the already-faithful NoMoves class.
 * @java Core/src/game/functions/booleans/no/moves/NoMoves.java
 */

import { NoMoves } from "./NoMoves.js";
import type { BooleanFunction, RoleType } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

registerBool1to1("no:moves", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Moves", positional[1] = optional role
  const roleNode = positional[1];
  const role: RoleType = (roleNode && isIdent(roleNode)) ? (roleNode.name as RoleType) : "Mover";
  return new NoMoves(role);
});
