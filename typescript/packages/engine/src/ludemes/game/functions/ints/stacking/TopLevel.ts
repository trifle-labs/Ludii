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
    // @java TopLevel.java:56-90 — if (!context.game().isStacking()) return 0;
    // else cs.sizeStack(loc, realType) - 1. In a Stacking game Java's
    // sizeStack counts EVERY piece in the pile, including count-backed piles:
    // Mahbouseh's (place Stack … count:15) start is a 15-high stack, so
    // (topLevel at:…) must report 14, not 0. TS stores homogeneous piles in
    // countAt with stacks[loc].length <= 1, so the raw stacks read always
    // returned 0 for them — falsely satisfying (= (topLevel at:(to)) 0) and
    // disabling Mahbouseh's blocked-by-2+-enemies guard. state.stackSize()
    // folds countAt in; the usesStacking gate reproduces Java's
    // !isStacking() early return so mancala/backgammon count piles (non-
    // Stacking games) still read 0.
    const loc = this.locn.eval(context);
    if (loc === UNDEFINED || loc < 0) return 0;
    const game = context.game as unknown as { usesStacking?: boolean };
    if (game.usesStacking === true) {
      const size = context.state.stackSize(loc);
      return size > 1 ? size - 1 : 0;
    }
    const size = (context.state as unknown as { stacks: readonly (readonly number[])[] }).stacks[loc]?.length ?? 0;
    return size > 1 ? size - 1 : 0;
  }

  /** @java TopLevel.isStatic() */
  public isStatic(): boolean { return false; }
}
