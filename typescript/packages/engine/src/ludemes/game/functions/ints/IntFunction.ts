// @java Core/src/game/functions/ints/IntFunction.java

/**
 * Returns an int.
 *
 * Java parity: IntFunction extends GameType — the core int-valued ludeme
 * interface. Every IntFunction implementation must provide eval(context),
 * exceeds, isHint, concepts, readsEvalContextRecursive,
 * writesEvalContextRecursive, missingRequirement, willCrash, toEnglish, isHand.
 *
 * NOTE: base.ts already exports a lean `IntFunction` for the 1:1 compile path.
 * This module exports the full Java-faithful contract as `JavaIntFunction`
 * to avoid a duplicate-identifier error.
 *
 * @java game/functions/ints/IntFunction.java
 * @author cambolbro and Eric.Piette
 */

import type { Context } from "../../../../context.js";

/**
 * Full Java-faithful IntFunction interface.
 * Named `JavaIntFunction` to avoid clashing with the lean `IntFunction`
 * already exported by `../../../base.ts`.
 *
 * @java game/functions/ints/IntFunction.java
 */
export interface JavaIntFunction {
  /**
   * @param context The context.
   * @return The result of applying this function to this trial.
   * @java IntFunction.eval(Context)
   */
  eval(context: Context): number;

  /**
   * @param context
   * @param other
   * @return True if this function would return a value that exceeds the given other.
   * @java IntFunction.exceeds(Context, IntFunction)
   */
  exceeds(context: Context, other: JavaIntFunction): boolean;

  /**
   * @return if the IntFunction is a hint.
   * @java IntFunction.isHint()
   */
  isHint(): boolean;

  /**
   * @return if is in hand.
   * @java IntFunction.isHand()
   */
  isHand(): boolean;

  /**
   * @param game The game — typed as unknown here since Game is not imported.
   * @return Accumulated flags corresponding to the game concepts.
   * @java IntFunction.concepts(Game)
   */
  concepts(game: unknown): Set<number>;

  /**
   * @return Accumulated flags corresponding to read data in EvalContext.
   * @java IntFunction.readsEvalContextRecursive()
   */
  readsEvalContextRecursive(): Set<number>;

  /**
   * @return Accumulated flags corresponding to write data in EvalContext.
   * @java IntFunction.writesEvalContextRecursive()
   */
  writesEvalContextRecursive(): Set<number>;

  /**
   * @param game The game.
   * @return True if a required ludeme is missing.
   * @java IntFunction.missingRequirement(Game)
   */
  missingRequirement(game: unknown): boolean;

  /**
   * @param game The game.
   * @return True if the ludeme can crash the game during its play.
   * @java IntFunction.willCrash(Game)
   */
  willCrash(game: unknown): boolean;

  /**
   * @param game
   * @return This IntFunction in English.
   * @java IntFunction.toEnglish(Game)
   */
  toEnglish(game: unknown): string;
}
