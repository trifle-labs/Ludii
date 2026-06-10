// @java Core/src/game/functions/ints/state/Counter.java

/**
 * Returns the automatic counter of the game state (incremented per move, reset
 * by (set Counter …)).
 *
 * @java game/functions/ints/state/Counter.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Counter extends BaseIntFunction {
  /** @java Counter() */
  public constructor() { super(); }

  /** @java Counter.eval(Context) — return context.state().counter(); */
  public override eval(context: Context): number {
    return (context.state as unknown as { counter?: number }).counter ?? -1;
  }

  /** @java Counter.isStatic() */
  public isStatic(): boolean { return false; }
}
