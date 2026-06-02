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
