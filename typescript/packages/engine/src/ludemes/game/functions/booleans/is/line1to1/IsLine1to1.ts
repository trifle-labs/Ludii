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

