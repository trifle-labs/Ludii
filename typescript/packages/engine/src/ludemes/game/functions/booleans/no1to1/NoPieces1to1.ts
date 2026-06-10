/**
 * NoPieces1to1.ts
 *
 * Registration bridge for the already-faithful NoPieces1to1 class.
 * @java Core/src/game/functions/booleans/no/pieces/NoPieces.java
 */

import { NoPieces1to1 } from "./NoPieces.js";
import type { BooleanFunction, RoleType } from "../../../../base.js";
import type { Context } from "../../../../../context.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import type { Game1to1 } from "../../../../Game1to1.js";

