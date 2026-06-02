/**
 * registry1to1-start.ts
 *
 * Barrel that imports all 1:1 start-rule class files for the second half
 * of game/rules/start/** (set/**, split/**, and root files).
 *
 * This corresponds to the Java package:
 *   game.rules.start (Set, Split, Deal, Start, StartRule)
 *   game.rules.start.set.** (all SetXxx variants and enum types)
 *   game.rules.start.split.** (Split, SplitType)
 *
 * Importing this barrel ensures the classes are defined so they can be
 * instantiated. (Unlike int/bool/region barrels, start-rule classes do not
 * self-register into a keyed registry; they are constructed directly.)
 */

// Enum types
import "./game/rules/start/set/SetRememberValueType.js";
import "./game/rules/start/set/SetStartGraphType.js";
import "./game/rules/start/set/SetStartHiddenType.js";
import "./game/rules/start/set/SetStartPlayerType.js";
import "./game/rules/start/set/SetStartPlayersType.js";
import "./game/rules/start/set/SetStartSitesType.js";
import "./game/rules/start/split/SplitType.js";

// Concrete start-rule implementations — set/** subtree
import "./game/rules/start/set/hidden/SetHidden.js";
import "./game/rules/start/set/player/SetAmount.js";
import "./game/rules/start/set/player/SetScore.js";
import "./game/rules/start/set/players/SetTeam.js";
import "./game/rules/start/set/remember/SetRememberValue.js";
import "./game/rules/start/set/sites/SetCost.js";
import "./game/rules/start/set/sites/SetCount.js";
import "./game/rules/start/set/sites/SetPhase.js";
import "./game/rules/start/set/sites/SetSite.js";

// Set dispatcher (re-exports all concrete sub-rules)
import "./game/rules/start/set/Set.js";

// split/** subtree
import "./game/rules/start/split/Split.js";

// Root start files
import "./game/rules/start/Deal.js";
import "./game/rules/start/Start.js";

export {};
