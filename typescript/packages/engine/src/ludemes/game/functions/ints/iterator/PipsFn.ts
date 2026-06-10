// @java Core/src/game/functions/ints/iterator/Pips.java

/**
 * Returns the pip count iterator value (set by forEach Die).
 *
 * @java game/functions/ints/iterator/Pips.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Pips extends BaseIntFunction {
  /** @java Pips() */
  public constructor() { super(); }

  /** @java Pips.construct() — Java exposes a no-arg construct as well. */
  public static construct(): Pips { return new Pips(); }

  /** @java Pips.eval(Context) — return context.pipCount(); */
  public override eval(context: Context): number {
    const ctx = context as unknown as { pipCount?: () => number; _evalPips?: number };
    return ctx.pipCount?.() ?? ctx._evalPips ?? 0;
  }

  /** @java Pips.isStatic() */
  public isStatic(): boolean { return false; }
}
