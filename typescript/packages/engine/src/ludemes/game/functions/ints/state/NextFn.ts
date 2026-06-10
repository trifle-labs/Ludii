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
    return (context.state as unknown as { next?: number }).next
      ?? (context.state.mover % context.game.numPlayers) + 1;
  }

  /** @java Next.isStatic() */
  public isStatic(): boolean { return false; }
}
