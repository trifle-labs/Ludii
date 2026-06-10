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
import type { IntFunction } from "../../../../../base.js";
import { IntConstant } from "../../../ints/IntConstant.js";

