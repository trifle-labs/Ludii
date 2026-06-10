// @java Core/src/game/functions/ints/iterator/Hint.java

/**
 * Returns the hint iterator value (deduction puzzles), or the hint at a site.
 *
 * @java game/functions/ints/iterator/Hint.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Hint extends BaseIntFunction {
  /** @java Hint.type */
  private readonly type: string | null;
  /** @java Hint.siteFn */
  private readonly siteFn: JavaIntFunction | null;

  /** @java Hint(@Opt SiteType type, @Opt @Name IntFunction at) */
  public constructor(type: string | null = null, at: JavaIntFunction | null = null) {
    super();
    this.type = type;
    this.siteFn = at;
  }

  /** @java Hint.eval(Context) — context.hint() or the hint recorded at the site */
  public override eval(context: Context): number {
    const ctx = context as unknown as { hint?: () => number; _evalHint?: number };
    if (this.siteFn === null) {
      return ctx.hint?.() ?? ctx._evalHint ?? 0;
    }
    const site = this.siteFn.eval(context);
    const game = context.game as unknown as {
      equipment?: { hints?: ReadonlyArray<{ region?: () => { eval(c: Context): number[] }; value?: () => number }> };
    };
    // @java Hint.eval: scan game.equipment().cellHints/vertexHints for the region
    // containing `site` and return its hint value.
    for (const h of game.equipment?.hints ?? []) {
      const region = h.region?.()?.eval(context) ?? [];
      if (region.includes(site)) return h.value?.() ?? 0;
    }
    void this.type;
    return 0;
  }

  /** @java Hint.isStatic() */
  public isStatic(): boolean { return false; }
}
