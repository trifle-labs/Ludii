/**
 * registry1to1-int-bvs.ts
 *
 * Barrel for the board/value/state (bvs) wave of 1:1 int ludeme ports.
 *
 * Import this file to self-register the following keys:
 *   wherelevel  (game/functions/ints/board/where/WhereLevel.java)
 *
 * All other Java files in:
 *   Core/src/game/functions/ints/board/**
 *   Core/src/game/functions/ints/value/**
 *   Core/src/game/functions/ints/state/**
 * are already registered by prior waves (see EXCLUSION LIST in PORT_WAVE_SPEC.md)
 * and must not be re-registered here.
 */

import "./game/functions/ints/board/where/WhereLevel1to1.js";

export {};
