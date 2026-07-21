// @java Core/src/game/functions/ints/count/simple/CountTrials.java

/**
 * Returns the number of instances of the game so far.
 *
 * @java game/functions/ints/count/simple/CountTrials.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";

/**
 * Returns the number of completed trials (game instances) so far.
 *
 * @java game/functions/ints/count/simple/CountTrials.java
 */
export class CountTrials extends BaseIntFunction {
  /**
   * @java CountTrials()
   */
  public constructor() {
    super();
  }

  /**
   * @java CountTrials.eval(Context)
   *
   * If context.subcontext() == null, recurse to parentContext.
   * Otherwise return context.completedTrials().size().
   */
  public override eval(context: Context): number {
    // Java: if (context.subcontext() == null) return eval(context.parentContext());
    const ctx = context as unknown as {
      subcontext?: () => unknown;
      parentContext?: () => Context;
      completedTrials?: () => { size: () => number } | unknown[];
    };

    if (typeof ctx.subcontext === "function" && ctx.subcontext() === null) {
      if (typeof ctx.parentContext === "function") {
        return this.eval(ctx.parentContext());
      }
      return 0;
    }

    // Java: return context.completedTrials().size();
    if (typeof ctx.completedTrials === "function") {
      const trials = ctx.completedTrials();
      if (trials !== null && trials !== undefined) {
        if (typeof (trials as { size?: () => number }).size === "function") {
          return (trials as { size: () => number }).size();
        }
        if (Array.isArray(trials)) {
          return trials.length;
        }
      }
    }

    return 0;
  }

  /** @java CountTrials.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java CountTrials.toString() */
  public override toString(): string {
    return "Trials()";
  }

  /** @java CountTrials.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java CountTrials.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java CountTrials.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java CountTrials.preprocess(Game) — nothing to do */
  public preprocess(_game: unknown): void {
    // Nothing to do.
  }
}
