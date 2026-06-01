/**
 * NoPieces1to1.ts
 *
 * Registration bridge for the already-faithful NoPieces1to1 class.
 * @java Core/src/game/functions/booleans/no/pieces/NoPieces.java
 */

import { NoPieces1to1 } from "./NoPieces.js";
import type { BooleanFunction, RoleType } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

registerBool1to1("no:pieces", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Pieces", positional[1] = optional role
  const roleNode = positional[1];
  const role: RoleType = (roleNode && isIdent(roleNode)) ? (roleNode.name as RoleType) : "Mover";
  return new NoPieces1to1(role);
});
