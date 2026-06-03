// @java Core/src/game/functions/floats/FloatFunction.java

/**
 * Returns a float.
 *
 * NOTE: The runtime interface used by concrete ludeme classes is `FloatFunction`
 * in src/ludemes/base.ts. This module contains the full Java interface surface
 * for coverage / documentation purposes only and re-exports it under a distinct
 * name to avoid duplicate-identifier errors.
 *
 * @java game.functions.floats.FloatFunction
 * @author cambolbro
 */

import type { Context } from "../../../../context.js";

/**
 * Full Java interface surface for FloatFunction.
 * @java game.functions.floats.FloatFunction
 */
export interface FloatFunctionFull {
  /** @java FloatFunction.eval(Context) */
  eval(context: Context): number;

  /** @java FloatFunction.concepts(Game) */
  concepts(game: unknown): Set<number>;

  /** @java FloatFunction.missingRequirement(Game) */
  missingRequirement(game: unknown): boolean;

  /** @java FloatFunction.willCrash(Game) */
  willCrash(game: unknown): boolean;

  /** @java FloatFunction.toEnglish(Game) */
  toEnglish(game: unknown): string;
}
