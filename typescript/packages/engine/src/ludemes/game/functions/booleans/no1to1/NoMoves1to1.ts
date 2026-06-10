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

