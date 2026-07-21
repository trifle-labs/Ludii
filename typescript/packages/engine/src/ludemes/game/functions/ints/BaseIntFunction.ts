// @java Core/src/game/functions/ints/BaseIntFunction.java

/**
 * Common functionality for IntFunction — override where necessary.
 *
 * @java game/functions/ints/BaseIntFunction.java
 * @author mrraow
 */

import type { Context } from "../../../../context.js";
import type { JavaIntFunction } from "./IntFunction.js";

/**
 * Abstract base class providing default implementations for IntFunction.
 * Concrete int-function ludemes extend this.
 *
 * NOTE: `eval` is intentionally left abstract (not implemented here), matching
 * Java's `abstract class BaseIntFunction implements IntFunction`.
 *
 * @java game/functions/ints/BaseIntFunction.java
 */
export abstract class BaseIntFunction implements JavaIntFunction {
  /** @java BaseIntFunction.eval(Context) — abstract, must be provided by subclass */
  public abstract eval(context: Context): number;

  /** @java BaseIntFunction.isHint() — default false */
  public isHint(): boolean {
    return false;
  }

  /** @java BaseIntFunction.isHand() — default false */
  public isHand(): boolean {
    return false;
  }

  /**
   * @java BaseIntFunction.exceeds(Context, IntFunction)
   * Default: eval(context) > other.eval(context).
   */
  public exceeds(context: Context, other: JavaIntFunction): boolean {
    return this.eval(context) > other.eval(context);
  }

  /** @java BaseIntFunction.concepts(Game) — default empty set */
  public concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java BaseIntFunction.readsEvalContextRecursive() — default empty set */
  public readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java BaseIntFunction.writesEvalContextRecursive() — default empty set */
  public writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java BaseIntFunction.missingRequirement(Game) — default false */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java BaseIntFunction.willCrash(Game) — default false */
  public willCrash(_game: unknown): boolean {
    return false;
  }

  /** @java BaseIntFunction.toEnglish(Game) — default empty string */
  public toEnglish(_game: unknown): string {
    return "";
  }
}
