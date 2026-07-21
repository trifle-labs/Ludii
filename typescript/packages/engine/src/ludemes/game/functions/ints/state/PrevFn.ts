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

  /**
   * @java Prev.eval(Context)
   *   Mover         -> context.state().prev()
   *   MoverLastTurn -> context.trial().lastTurnMover(context.state().mover())
   * The two differ in same-turn (moveAgain) games: within one turn `prev` is
   * the same player who is still moving, while `lastTurnMover` walks the move
   * log back to the most recent DIFFERENT mover (Fibonacci Nim's `Max` reads
   * `(value Player (prev MoverLastTurn))` mid-turn and must see the opponent).
   */
  public override eval(context: Context): number {
    const typeName = this.type == null ? "Mover" : String(this.type);
    if (typeName === "MoverLastTurn") {
      const last = (context.trial as unknown as { lastTurnMover?(m: number): number })
        .lastTurnMover?.(context.state.mover);
      if (last !== undefined && last > 0) return last;
      // fall through to the previous-mover estimate when no distinct mover yet
    }
    const stored = (context.state as unknown as { prev?: number }).prev ?? 0;
    if (stored > 0) return stored;
    return ((context.state.mover - 2 + context.game.numPlayers) % context.game.numPlayers) + 1;
  }

  /** @java Prev.isStatic() */
  public isStatic(): boolean { return false; }
}
