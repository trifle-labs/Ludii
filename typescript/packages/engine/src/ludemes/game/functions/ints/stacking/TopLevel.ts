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
    // @java TopLevel.eval — if (!context.game().isStacking()) return 0; else
    // cs.sizeStack(loc, realType) - 1. Our Game carries no Stacking flag, so
    // gate on the REAL per-level stack instead: a flat piece or a count-pile
    // (mancala/backgammon, stacks[loc].length <= 1) reports level 0, exactly
    // Java's non-stacking early return; a genuine stack (Bashni [P2,P1])
    // reports its top level. The old code probed sizeStack/stackAt, neither
    // of which exists with that shape on State — TopLevel always returned 0
    // and IsUnpromoted (level:(topLevel ...)) misrouted commanders to the
    // king branch.
    const loc = this.locn.eval(context);
    if (loc === UNDEFINED || loc < 0) return 0;
    const size = (context.state as unknown as { stacks: readonly (readonly number[])[] }).stacks[loc]?.length ?? 0;
    return size > 1 ? size - 1 : 0;
  }

  /** @java TopLevel.isStatic() */
  public isStatic(): boolean { return false; }
}
