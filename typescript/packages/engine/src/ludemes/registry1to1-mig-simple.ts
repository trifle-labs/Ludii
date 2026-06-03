/**
 * registry1to1-mig-simple.ts
 *
 * Sub-barrel that imports all 1:1 ludeme class files migrated in the
 * "simple" wave (note, claim, avoidstoredstate, addscore, forget, satisfy).
 * Importing this file causes each class to self-register via its
 * registerMoves1to1() side effect at module load time.
 *
 * The orchestrator will add an import of this barrel to registry1to1-moves.ts
 * once the corresponding inline branches are removed from compiler1to1.ts.
 */

import "./game/rules/play/moves/nonDecision/effect/Note1to1.js";
import "./game/rules/play/moves/nonDecision/effect/Claim1to1.js";
import "./game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState1to1.js";
import "./game/rules/play/moves/nonDecision/effect/requirement/Satisfy1to1.js";
import "./game/rules/play/moves/nonDecision/effect/state/AddScore1to1.js";
import "./game/rules/play/moves/nonDecision/effect/state/forget/Forget1to1.js";

export {};
