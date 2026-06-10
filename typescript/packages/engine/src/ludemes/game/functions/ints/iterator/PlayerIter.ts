// @java Core/src/game/functions/ints/iterator/Player.java

/**
 * Returns the "player" iterator value (set by forEach Player).
 *
 * @java game/functions/ints/iterator/Player.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Player extends BaseIntFunction {
  /** @java Player() */
  public constructor() { super(); }

  /** @java Player.eval(Context) — return context.player(); */
  public override eval(context: Context): number {
    const ctx = context as unknown as { player?: () => number; _evalPlayer?: number };
    return ctx.player?.() ?? ctx._evalPlayer ?? context.state.mover;
  }

  /** @java Player.isStatic() */
  public isStatic(): boolean { return false; }
}
