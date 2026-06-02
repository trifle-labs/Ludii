/**
 * Player1to1.ts
 * @java game/util/moves/Player.java
 *
 * Parameter holder for the ``who'' clause of move generators.
 * Holds the player index function. Defaults to Mover if null.
 *
 * This is a data class — no eval(ctx). Move generators call index().eval(ctx).
 */

import type { Context } from "../../../../context.js";
import type { IntFunction } from "../../../base.js";

/** Fallback: returns the current mover. */
class MoverDefault implements IntFunction {
  /** @java game/functions/ints/state/Mover.java — eval: context.state().mover() */
  public eval(ctx: Context): number {
    return ctx.state.mover;
  }
}

const MOVER_DEFAULT = new MoverDefault();

/**
 * Specifies operations based on the ``who'' data.
 * @java game/util/moves/Player.java
 */
export class Player1to1 {
  /** @java Player.index — original index function (may be null). */
  private readonly originalIndex: IntFunction | null;

  /**
   * @java Player.indexReturned — the index function returned.
   * If original is null, defaults to (mover).
   */
  private readonly indexReturned: IntFunction;

  /**
   * @java game/util/moves/Player.java — constructor(IntFunction index)
   * Java: this.indexReturned = (index == null) ? new Mover() : index;
   */
  public constructor(index: IntFunction | null) {
    this.originalIndex = index;
    this.indexReturned = index ?? MOVER_DEFAULT;
  }

  /** @java Player.originalIndex() */
  public original(): IntFunction | null {
    return this.originalIndex;
  }

  /**
   * @java Player.index()
   * Returns the effective index function (never null; defaults to Mover).
   */
  public index(): IntFunction {
    return this.indexReturned;
  }
}
