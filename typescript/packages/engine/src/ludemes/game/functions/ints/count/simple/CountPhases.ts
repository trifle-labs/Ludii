// @java Core/src/game/functions/ints/count/simple/CountPhases.java

/**
 * Returns the number of phases of the game.
 *
 * @java game/functions/ints/count/simple/CountPhases.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";

/**
 * Returns the number of phases of the game.
 *
 * @java game/functions/ints/count/simple/CountPhases.java
 */
export class CountPhases extends BaseIntFunction {
  /** @java CountPhases.preComputedInteger */
  private preComputedInteger: number | null = null;

  /**
   * @java CountPhases()
   */
  public constructor() {
    super();
  }

  /**
   * @java CountPhases.eval(Context)
   *
   * Returns the number of phases of the game. Uses a precomputed cache when
   * available (preprocess is called with a fresh Context).
   */
  public override eval(context: Context): number {
    if (this.preComputedInteger !== null) {
      return this.preComputedInteger;
    }

    // Java: return context.game().rules().phases().length;
    const phases = (context as unknown as {
      game: () => { rules: () => { phases: () => unknown[] } }
    }).game?.()?.rules?.()?.phases?.();
    if (phases !== undefined && phases !== null) {
      return phases.length;
    }

    // Fallback: access via context.game typed as Game1to1
    const game = context.game as unknown as {
      rules?: { phases?: unknown[] };
    };
    return game.rules?.phases?.length ?? 1;
  }

  /** @java CountPhases.isStatic() */
  public isStatic(): boolean {
    return true;
  }

  /** @java CountPhases.toString() */
  public override toString(): string {
    return "Phases()";
  }

  /** @java CountPhases.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java CountPhases.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java CountPhases.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /**
   * @java CountPhases.preprocess(Game)
   *
   * Precomputes the phase count by evaluating with a fresh context.
   */
  public preprocess(game: unknown): void {
    // Java: preComputedInteger = Integer.valueOf(eval(new Context(game, null)));
    // We access phases count directly from the game object.
    const g = game as unknown as {
      rules?: { phases?: unknown[] };
    };
    const len = g.rules?.phases?.length;
    if (len !== undefined) {
      this.preComputedInteger = len;
    }
  }
}
