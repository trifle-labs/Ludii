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
    return (context.state.mover % context.game.numPlayers) + 1;
  }

  /** @java Next.isStatic() */
  public isStatic(): boolean { return false; }
}
