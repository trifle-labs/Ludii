// @java Core/src/game/rules/play/moves/nonDecision/NonDecision.java

/**
 * Defines moves that do not involve an immediate decision by the player.
 *
 * @java game/rules/play/moves/nonDecision/NonDecision.java
 *
 * Java: public abstract class NonDecision extends Moves
 *   - eval() returns null (grammar trick to join the grammar)
 *
 * Non-decision moves include move operators that might combine further
 * decision moves.
 */

import type { Context } from "../../../../../../context.js";
import type { Move } from "../../../../../../move.js";
import { Moves } from "../Moves.js";
import type { ThenLike } from "../Moves.js";

/**
 * Abstract base class for non-decision moves.
 *
 * @java game/rules/play/moves/nonDecision/NonDecision.java
 */
export abstract class NonDecision extends Moves {
  /**
   * @java game/rules/play/moves/nonDecision/NonDecision.java — constructor(Then)
   * @param then The subsequents of the moves.
   */
  public constructor(then: ThenLike | null = null) {
    super(then);
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/NonDecision.java — eval(Context)
   * Returns null in Java as a "trick ludeme" to join the grammar.
   * Concrete subclasses override with real logic.
   */
  public override eval(_ctx: Context): Move[] {
    return [];
  }
}
