// @java Core/src/game/functions/ints/state/Next.java

/**
 * Returns the index of the next player.
 *
 * @java game/functions/ints/state/Next.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Next extends BaseIntFunction {
  /** @java Next() */
  public constructor() { super(); }

  /** @java Next.construct() */
  public static construct(): Next { return new Next(); }

  /** @java Next.eval(Context) — return context.state().next(); */
  public override eval(context: Context): number {
    // The engine's state.next is an OVERRIDE slot defaulting 0 (= none); Java's
    // State.next() is always a real player. 0 means "use natural order".
    const override = (context.state as unknown as { next?: number }).next ?? 0;
    if (override > 0) return override;
    // @java Game.java:3210-3215 — the natural successor SKIPS inactive
    // (eliminated) players; Java's state.next always holds that adjusted
    // value. So Long Sucker: with P4 eliminated, (next) from mover=3 must be
    // P1, not P4 — TS generated SetNextPlayer(4) and handed the turn to a
    // dead player (MM at ply 62).
    const n = context.game.numPlayers;
    let next = (context.state.mover % n) + 1;
    const st = context.state as unknown as { activePlayer?: (p: number) => boolean };
    let guard = n;
    while (st.activePlayer && !st.activePlayer(next) && guard-- > 0) {
      next = (next % n) + 1;
    }
    return next;
  }

  /** @java Next.isStatic() */
  public isStatic(): boolean { return false; }
}
