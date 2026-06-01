/**
 * registry1to1-int-cardrest.ts
 *
 * Barrel for the "card + root ints" slice of the 1:1 Int port.
 *
 * Imported for side-effects only: each module calls registerInt1to1()
 * which inserts the class factory into the global int registry so
 * compiler1to1.ts can find it.
 *
 * Keys added by this barrel:
 *   "card"    → CardTrumpSuit1to1 (TrumpSuit subtype only; others deferred)
 *   "toint"   → ToInt1to1 (boolean branch only; float branch deferred)
 *
 * DEFERRED (not registered — missing TS engine API):
 *   card:rank, card:suit, card:trumprank, card:trumpvalue
 *     — require context.components()[what].rank() / .suit() / .trumpRank()
 *       / .trumpValue() which are card-specific Component APIs absent in the
 *       TS engine.
 *   toint (float branch)
 *     — FloatFunction is not implemented in the TS engine.
 *
 * All other keys in the assigned slice were already in the exclusion list
 * (toplevel, toplev, pathextent, matchscore, face, tracksite, etc.) and
 * are therefore deliberately omitted here.
 */

import "./game/functions/ints/card/simple/CardTrumpSuit1to1.js";
import "./game/functions/ints/ToInt1to1.js";

export {};
