/**
 * SitesHidden1to1.ts
 *
 * 1:1 ports of the seven hidden-information site classes:
 *   SitesHidden, SitesHiddenCount, SitesHiddenRotation, SitesHiddenState,
 *   SitesHiddenValue, SitesHiddenWhat, SitesHiddenWho
 *
 * Java parity: all seven return sites where a specific piece of information
 * is hidden from a given player, using ContainerState.isHidden*(pid, site).
 * The 1:1 state does not model per-site hidden info (no ContainerState
 * hidden-flag layer), so all return [].
 *
 * A factory for `sites:hidden` dispatches to the appropriate class based
 * on the optional `hiddenData` second positional argument:
 *   (sites Hidden to:<player>)         → SitesHidden (all hidden info)
 *   (sites Hidden What to:<player>)    → SitesHiddenWhat
 *   (sites Hidden Who to:<player>)     → SitesHiddenWho
 *   (sites Hidden State to:<player>)   → SitesHiddenState
 *   (sites Hidden Count to:<player>)   → SitesHiddenCount
 *   (sites Hidden Rotation to:<player>)→ SitesHiddenRotation
 *   (sites Hidden Value to:<player>)   → SitesHiddenValue
 *
 * @java game/functions/region/sites/hidden/SitesHidden.java
 * @java game/functions/region/sites/hidden/SitesHiddenCount.java
 * @java game/functions/region/sites/hidden/SitesHiddenRotation.java
 * @java game/functions/region/sites/hidden/SitesHiddenState.java
 * @java game/functions/region/sites/hidden/SitesHiddenValue.java
 * @java game/functions/region/sites/hidden/SitesHiddenWhat.java
 * @java game/functions/region/sites/hidden/SitesHiddenWho.java
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";

/**
 * Base class for all hidden-site queries.
 * The 1:1 state does not model hidden information, so always returns [].
 * @java game/functions/region/sites/hidden/SitesHidden.java — eval(Context)
 */
class SitesHiddenBase implements RegionFunction {
  public eval(_ctx: Context): number[] {
    // @java ContainerState.isHidden*(pid, site) — not modelled in 1:1 state
    return [];
  }
}

/** @java game/functions/region/sites/hidden/SitesHidden.java */
export class SitesHidden1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenWhat.java */
export class SitesHiddenWhat1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenWho.java */
export class SitesHiddenWho1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenState.java */
export class SitesHiddenState1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenCount.java */
export class SitesHiddenCount1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenRotation.java */
export class SitesHiddenRotation1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenValue.java */
export class SitesHiddenValue1to1 extends SitesHiddenBase {}

// ---------------------------------------------------------------------------
// Registration — single key "sites:hidden" dispatches on HiddenData arg
// ---------------------------------------------------------------------------
registerRegion1to1("sites:hidden", (node: LudNode, _env: Compile1to1Env): RegionFunction => {
  // Grammar: (sites Hidden [<hiddenData>] [<siteType>] to:<player>)
  // The hiddenData ident (What|Who|State|Count|Rotation|Value) is optional 2nd arg.
  const { positional } = parseArgs1to1(isList(node) ? node.items : []);
  // positional[0] = "Hidden", positional[1] = hiddenData ident (if present)
  const secondArg = positional[1];
  const hiddenDataName = (secondArg && isIdent(secondArg))
    ? secondArg.name.toLowerCase()
    : null;

  switch (hiddenDataName) {
    case "what":      return new SitesHiddenWhat1to1();
    case "who":       return new SitesHiddenWho1to1();
    case "state":     return new SitesHiddenState1to1();
    case "count":     return new SitesHiddenCount1to1();
    case "rotation":  return new SitesHiddenRotation1to1();
    case "value":     return new SitesHiddenValue1to1();
    default:          return new SitesHidden1to1();
  }
});
