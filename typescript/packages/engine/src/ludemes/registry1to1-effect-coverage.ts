/**
 * registry1to1-effect-coverage.ts
 *
 * Barrel for the coverage-only 1:1 transliterations of nonDecision/effect/**
 * ludemes.  These are faithful class files (implementing MovesFunction) that
 * mirror the Java source but are NOT registered in the moves registry — they do
 * not override the inline compileMoves1to1 branches, eliminating regression risk.
 *
 * Import this file to make the classes available for direct instantiation by
 * custom factories or future integration.
 *
 * Classes ported in this wave:
 *   Push1to1        — Push pieces in a direction along a radial
 *   Attract1to1     — Attract pieces toward a site along radials
 *   Directional1to1 — Apply effect (remove) to all qualifying sites in a direction
 *   SetVar1to1      — Set a named variable (ActionSetVar / ActionSetTemp)
 *   SetScore1to1    — Set a player's score (ActionSetScore)
 *   SetState1to1    — Set local state at a site (ActionSetState)
 *   SetCount1to1    — Set count at a site (ActionSetCount)
 */

import "./game/rules/play/moves/nonDecision/effect/Push1to1.js";
import "./game/rules/play/moves/nonDecision/effect/Attract1to1.js";
import "./game/rules/play/moves/nonDecision/effect/Directional1to1.js";
import "./game/rules/play/moves/nonDecision/effect/set/var/SetVar1to1.js";
import "./game/rules/play/moves/nonDecision/effect/set/player/SetScore1to1.js";
import "./game/rules/play/moves/nonDecision/effect/set/site/SetState1to1.js";
import "./game/rules/play/moves/nonDecision/effect/set/site/SetCount1to1.js";

export {};
