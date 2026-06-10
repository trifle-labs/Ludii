// @java Core/src/game/functions/ints/state/Prev.java

/**
 * Returns the index of the previous mover (or previous turn's mover).
 *
 * @java game/functions/ints/state/Prev.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Prev extends BaseIntFunction {
  /** @java Prev.type — Mover (default) or MoverLastTurn */
  private readonly type: string | null;

  /** @java Prev(@Opt PrevType type) */
  public constructor(type: string | null = null) {
    super();
    this.type = type;
  }

  /** @java Prev.eval(Context) — state.prev() (MoverLastTurn handled by trial walk in Java) */
  public override eval(context: Context): number {
    void this.type;
    const stored = (context.state as unknown as { prev?: number }).prev ?? 0;
    if (stored > 0) return stored;
    return ((context.state.mover - 2 + context.game.numPlayers) % context.game.numPlayers) + 1;
  }

  /** @java Prev.isStatic() */
  public isStatic(): boolean { return false; }
}
