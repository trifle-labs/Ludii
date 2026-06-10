// @java Core/src/game/functions/ints/stacking/TopLevel.java

/**
 * Returns the top level of a stack (sizeStack - 1), 0 for non-stacking games.
 *
 * @java game/functions/ints/stacking/TopLevel.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

const UNDEFINED = -1;

export class TopLevel extends BaseIntFunction {
  /** @java TopLevel.locn */
  private readonly locn: JavaIntFunction;
  /** @java TopLevel.type */
  private readonly type: string | null;

  /** @java TopLevel(@Opt SiteType type, @Name IntFunction at) */
  public constructor(type: string | null, at: JavaIntFunction) {
    super();
    this.type = type;
    this.locn = at;
  }

  /**
   * @java TopLevel.eval(Context) — if (!context.game().isStacking()) return 0;
   * else cs.sizeStack(loc, realType) - 1.
   */
  public override eval(context: Context): number {
    const game = context.game as unknown as { isStacking?: () => boolean; _isStacking?: boolean };
    const stacking = game.isStacking?.() ?? game._isStacking ?? false;
    if (!stacking) return 0;
    const loc = this.locn.eval(context);
    if (loc === UNDEFINED) return 0;
    const state = context.state as unknown as { sizeStack?: (site: number, type?: string | null) => number; stackAt?: (site: number) => unknown[] };
    const size = state.sizeStack?.(loc, this.type) ?? (state.stackAt?.(loc) as unknown[] | undefined)?.length ?? 0;
    return size > 0 ? size - 1 : 0;
  }

  /** @java TopLevel.isStatic() */
  public isStatic(): boolean { return false; }
}
