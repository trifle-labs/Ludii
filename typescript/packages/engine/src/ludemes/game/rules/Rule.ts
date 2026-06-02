// @java Core/src/game/rules/Rule.java
//
// Defines a rule of the game. In Java this is an interface that extends
// GameType and Ludeme and declares a single eval(Context) method.

/**
 * Defines a rule of the game.
 *
 * Java: Rule extends GameType, Ludeme.
 * In the 1:1 TS port we model it as an interface; GameType and Ludeme are
 * represented as a minimal structural type so the file remains self-contained.
 *
 * @java game/rules/Rule.java
 */

import type { Context } from "../../../context.js";

/**
 * Minimal structural stand-in for Java's GameType interface.
 * @java game/types/state/GameType.java
 */
export interface GameType {
  // GameType carries no methods in the coverage we need here.
}

/**
 * Minimal structural stand-in for Java's Ludeme marker interface.
 * @java other/Ludeme.java
 */
export interface Ludeme {
  // Ludeme carries no methods in the coverage we need here.
}

/**
 * Defines a rule of the game.
 *
 * @java game.rules.Rule
 */
export interface Rule extends GameType, Ludeme {
  /**
   * Evaluate (apply / test) this rule against the given context.
   *
   * @java Rule.eval(Context context)
   */
  eval(context: Context): void;
}
