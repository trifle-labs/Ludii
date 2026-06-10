/**
 * Misc1to1.ts
 *
 * Miscellaneous 1:1 int ludeme ports:
 *   HandSite, RegionSite, TrackSite, TopLevel,
 *   count:Pips, count:LegalMoves, count:Active,
 *   state (at site), var (named), face, amount, pot,
 *   sites→int (coerce region to count)
 *
 * @java game/functions/ints/board/HandSite.java (-> already has 1:1 at state1to1/)
 * @java game/functions/ints/board/RegionSite.java
 * @java game/functions/ints/trackSite/TrackSite.java
 * @java game/functions/ints/stacking/TopLevel.java
 * @java game/functions/ints/count/component/CountPips.java
 * @java game/functions/ints/count/simple/CountLegalMoves.java
 * @java game/functions/ints/count/simple/CountActive.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isString, isList } from "@ludii/typescript-language";
import type { RoleType } from "../../../../base.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { HandSite } from "../../ints/state1to1/HandSite.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1, compileBool1to1 } from "../../../../../compiler1to1.js";
import type { BooleanFunction } from "../../../../base.js";

// ---------------------------------------------------------------------------
// count:Pips  (sum of all dice face values)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// count:LegalMoves  (number of legal moves for mover)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// count:Active  (number of active players)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// handSite
// ---------------------------------------------------------------------------
