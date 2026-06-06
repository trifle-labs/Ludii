// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/ForEach.java

/**
 * Iterates over a set of items.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/ForEach.java
 * @author Eric.Piette
 *
 * Use this ludeme to iterate over a set of items such as pieces, players,
 * directions or regions, and apply specified actions to each item.
 *
 * In Java this is a pure factory class whose static construct(...) methods
 * delegate to concrete subclasses. The instance eval() throws
 * UnsupportedOperationException and should never be called directly.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import { Effect } from "../../effect/Effect.js";

/**
 * @java game/rules/play/moves/nonDecision/operators/foreach/ForEach.java
 *
 * Factory/marker class for the ForEach family. eval() must never be called
 * directly (Java throws UnsupportedOperationException).
 */
export class ForEach extends Effect {
  /**
   * @java ForEach()
   */
  public constructor() {
    super(null);
  }

  /**
   * @java ForEach.eval(Context)
   * Should not be called, should only be called on subclasses.
   */
  public override eval(_ctx: Context): Move[] {
    throw new Error("ForEach.eval(): Should never be called directly.");
  }

  /**
   * @java ForEach.isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }

  /**
   * @java ForEach.gameFlags(Game)
   */
  public override gameFlags(): number {
    return 0;
  }

  /**
   * @java ForEach.preprocess(Game)
   */
  public override preprocess(): void {
    // Nothing to do.
  }
}
