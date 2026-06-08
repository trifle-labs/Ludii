/**
 * Dispatcher / factory for all "(set …)" start rules.
 *
 * In Java this is a static-factory class with overloaded construct() methods that
 * select and construct the appropriate concrete SetXxx rule. In the 1:1 TS port
 * the concrete sub-classes are the primary artefacts; this file provides the
 * dispatcher surface for callers that need to construct set-rules generically.
 *
 * @java game/rules/start/set/Set.java — static construct() dispatchers
 *
 * NOTE: eval() on the Java Set class is declared to throw
 * UnsupportedOperationException — it is never called directly; only the
 * concrete sub-class eval is invoked. The TS equivalent is the same pattern:
 * Set1to1 itself is not a StartRule; use the concrete sub-classes instead.
 */

export { SetStartSitesType } from "./SetStartSitesType.js";
export { SetStartPlayerType } from "./SetStartPlayerType.js";
export { SetStartPlayersType } from "./SetStartPlayersType.js";
export { SetStartHiddenType } from "./SetStartHiddenType.js";
export { SetStartGraphType } from "./SetStartGraphType.js";
export { SetRememberValueType } from "./SetRememberValueType.js";

// Concrete sub-rules (re-export for convenience)
export { SetHidden1to1 } from "./hidden/SetHidden.js";
export { SetAmount1to1 } from "./player/SetAmount.js";
export { SetScore1to1 } from "./player/SetScore.js";
export { SetTeam1to1 } from "./players/SetTeam.js";
export { SetRememberValue1to1 } from "./remember/SetRememberValue.js";
export { SetCost1to1 } from "./sites/SetCost.js";
export { SetCount1to1 } from "./sites/SetCount.js";
export { SetPhase1to1 } from "./sites/SetPhase.js";
export { SetSite1to1 } from "./sites/SetSite.js";

import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import type { StartRule } from "../StartRule.js";
import { SetCountStart1to1 } from "../SetCountStart1to1.js";
import { SetCost1to1 } from "./sites/SetCost.js";
import { SetPhase1to1 } from "./sites/SetPhase.js";

/**
 * Static-factory dispatcher for "(set …)" start rules, mirroring Java's
 * game.rules.start.set.Set.construct() overloads. ArgCompiler invokes the static
 * construct* method whose arity matches the bound Java executable.
 *
 * @java game/rules/start/set/Set.java — construct() dispatchers
 */
export class SetDispatch {
  /**
   * @java Set.construct(SetStartSitesType startType, IntFunction value, @Opt SiteType type,
   *   @Or @Name IntFunction at, @Or @Name RegionFunction to) — routes Count/Cost/Phase.
   * Java maps `at`->site, `to`->region. 5 required params so .length===5 matches the bind.
   */
  public static constructSites(
    startType: string,
    value: IntFunction,
    type: SiteType | null,
    at: IntFunction | null,
    to: RegionFunction | null,
  ): StartRule | null {
    switch (startType) {
      case "Count": return new SetCountStart1to1(value, type, at, to);
      case "Cost": return new SetCost1to1(value, type, at, to);
      case "Phase": return new SetPhase1to1(value, type, at, to);
      default: return null;
    }
  }
}
