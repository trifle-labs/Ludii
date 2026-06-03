/**
 * registry1to1-mig-operators.ts
 *
 * Sub-barrel: imports all migrated operator/logical/requirement move ludeme
 * class files so they self-register via registerMoves1to1() side effects at
 * module load time.
 *
 * Migrated heads: and, or, append, seq (logical/), priority (effect/requirement/).
 */

// nonDecision/operators/logical/ — registered faithful move-operator classes
import "./game/rules/play/moves/nonDecision/operators/logical/And1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Or1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Append1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Seq1to1.js";

// nonDecision/effect/requirement/ — registered faithful priority class
import "./game/rules/play/moves/nonDecision/effect/requirement/Priority1to1.js";

export {};
