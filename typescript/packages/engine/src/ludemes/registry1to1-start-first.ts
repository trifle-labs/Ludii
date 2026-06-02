/**
 * registry1to1-start-first.ts
 *
 * Barrel that imports all 1:1 start-rule class files for the FIRST HALF
 * (alphabetical) of game/rules/start/**:
 *   game.rules.start.deductionPuzzle  (deferred — see report)
 *   game.rules.start.forEach.**       (ForEachPlayer, ForEachSite, ForEachValue)
 *   game.rules.start.place.**         (PlaceItem, enum types)
 *
 * Importing this barrel ensures the classes are defined so they can be
 * instantiated. Start-rule classes do not self-register into a keyed
 * registry; they are constructed directly by compiler1to1.ts.
 *
 * Wave assignment: FIRST ~21 files, subpackages deductionPuzzle/, forEach/,
 * place/ (PlaceItem/PlaceRandom/PlaceCustom/etc.).
 */

// --- Enum types: forEach ---
import "./game/rules/start/forEach/ForEachStartValueType1to1.js";
import "./game/rules/start/forEach/ForEachTeamType1to1.js";

// --- forEach concrete implementations ---
import "./game/rules/start/forEach/player/ForEachPlayer1to1.js";
import "./game/rules/start/forEach/site/ForEachSite1to1.js";
import "./game/rules/start/forEach/value/ForEachValue1to1.js";

// --- Enum types: place ---
import "./game/rules/start/place/PlaceRandomType1to1.js";
import "./game/rules/start/place/PlaceStackType1to1.js";

// --- place/item concrete implementation ---
import "./game/rules/start/place/item/PlaceItem1to1.js";

// deductionPuzzle/Set1to1 — DEFERRED: ActionSet puzzle API not available
//   in applyToInitialState. See port-wave report.
// forEach/team/ForEachTeam1to1 — DEFERRED: state.playerInTeam() not
//   available in applyToInitialState.
// place/random/PlaceRandom1to1 — DEFERRED: RNG (SeededRng) not available
//   in applyToInitialState.
// place/stack/PlaceCustomStack1to1 — DEFERRED: stack placement (isStack=true)
//   not supported by the cells[]/whats[]/countAt[] arrays.
// place/stack/PlaceMonotonousStack1to1 — DEFERRED: same as above.

export {};
