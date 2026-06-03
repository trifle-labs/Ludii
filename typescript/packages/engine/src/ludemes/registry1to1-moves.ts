/**
 * registry1to1-moves.ts
 *
 * Barrel that imports all 1:1 moves ludeme class files so they
 * self-register via registerMoves1to1() side effects at module load time.
 *
 * Import this from compiler1to1.ts to wire the moves registry.
 * Each ported package adds its own sub-barrel import line here.
 */

// (moves package sub-barrels are added here as they are ported)

// nonDecision/effect — live faithful registered move classes (logic relocated
// verbatim from the inline compiler1to1 handlers; registry shadows inline).
import "./game/rules/play/moves/nonDecision/effect/Enclose1to1.js";

export {};
