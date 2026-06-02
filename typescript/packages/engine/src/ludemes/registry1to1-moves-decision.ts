/**
 * registry1to1-moves-decision.ts
 *
 * Barrel for the 1:1 faithful coverage classes ported in the decision/** and
 * nonDecision/operators/** subtrees.
 *
 * IMPORTANT: None of these classes are registered via registerMoves1to1().
 * The inline compileMoves1to1Impl already handles all these keys ("and", "or",
 * "if", "forEach", "priority", "then", "do", "append", "max", "seq").
 * Registering them would OVERRIDE working inline logic → regression.
 *
 * These imports make the class files part of the module graph (tree-shaking
 * aware) and allow instanceof checks / class hierarchy assertions without
 * interfering with the live registry.
 */

// -- decision/ ---------------------------------------------------------------
// Decision1to1: abstract base matching Decision.java class hierarchy.
import "./game/rules/play/moves/decision/Decision1to1.js";

// Move1to1: polymorphic dispatcher structural port (NOT registered).
import "./game/rules/play/moves/decision/Move1to1.js";

// Move*Type1to1: enum markers (trivial ports of Java enums).
import "./game/rules/play/moves/decision/MoveBetType1to1.js";
import "./game/rules/play/moves/decision/MoveFromToType1to1.js";
import "./game/rules/play/moves/decision/MoveHopType1to1.js";
import "./game/rules/play/moves/decision/MoveLeapType1to1.js";
import "./game/rules/play/moves/decision/MoveMessageType1to1.js";
import "./game/rules/play/moves/decision/MovePromoteType1to1.js";
import "./game/rules/play/moves/decision/MoveRemoveType1to1.js";
import "./game/rules/play/moves/decision/MoveSelectType1to1.js";
import "./game/rules/play/moves/decision/MoveSetType1to1.js";
import "./game/rules/play/moves/decision/MoveShootType1to1.js";
import "./game/rules/play/moves/decision/MoveSimpleType1to1.js";
import "./game/rules/play/moves/decision/MoveSiteType1to1.js";
import "./game/rules/play/moves/decision/MoveSlideType1to1.js";
import "./game/rules/play/moves/decision/MoveStepType1to1.js";
import "./game/rules/play/moves/decision/MoveSwapType1to1.js";

// -- nonDecision/operator/ (singular) ----------------------------------------
// Operator1to1: abstract base matching Operator.java class hierarchy.
import "./game/rules/play/moves/nonDecision/operator/Operator1to1.js";

// -- nonDecision/operators/logical/ ------------------------------------------
// Faithful 1:1 port classes; NOT registered (inline handles all keys).
import "./game/rules/play/moves/nonDecision/operators/logical/And1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Or1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/If1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Append1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/AllCombinations1to1.js";
import "./game/rules/play/moves/nonDecision/operators/logical/Seq1to1.js";

export {};
