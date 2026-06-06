// @java Core/src/game/functions/ints/state/Pot.java

/**
 * Returns the pot of the game.
 *
 * @java game/functions/ints/state/Pot.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

/**
 * Returns the pot of the game.
 *
 * @java game/functions/ints/state/Pot.java
 */
export class Pot extends BaseIntFunction {
  /**
   * @java Pot()
   */
  public constructor() {
    super();
    // Nothing to do.
  }

  /**
   * @java Pot.eval(Context)
   *
   * Returns the pot value from the game state.
   */
  public override eval(context: Context): number {
    // Java: return context.state().pot();
    return (context.state as unknown as { pot?: () => number }).pot?.() ?? 0;
  }

  /** @java Pot.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java Pot.gameFlags(Game) */
  public gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java Pot.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set<number>();
  }

  /** @java Pot.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java Pot.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java Pot.preprocess(Game) */
  public preprocess(_game: unknown): void {
    // nothing to do
  }

  /** @java Pot.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the pot";
  }
}
