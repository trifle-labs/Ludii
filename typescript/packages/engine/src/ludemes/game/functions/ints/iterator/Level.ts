// @java Core/src/game/functions/ints/iterator/Level.java

/**
 * Returns the "level" iterator value.
 *
 * @java game/functions/ints/iterator/Level.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Level extends BaseIntFunction {
  /** @java Level() */
  public constructor() { super(); }

  /** @java Level.eval(Context) — return context.level(); */
  public override eval(context: Context): number {
    const ctx = context as unknown as { level?: () => number; _evalLevel?: number };
    return ctx.level?.() ?? ctx._evalLevel ?? 0;
  }

  /** @java Level.isStatic() */
  public isStatic(): boolean { return false; }
}
