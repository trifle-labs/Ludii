// @java Core/src/game/rules/play/moves/nonDecision/effect/Effect.java

/**
 * Defines moves which do not involve a player decision.
 *
 * @java game/rules/play/moves/nonDecision/effect/Effect.java
 *
 * Java: public abstract class Effect extends NonDecision
 *   - eval() returns null (grammar trick)
 *
 * Effect moves are typically applied in response to player decision moves,
 * e.g. the capture of a piece following the move of another piece.
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import { NonDecision } from "../NonDecision.js";
import type { ThenLike } from "../../Moves.js";

/**
 * Abstract base class for effect moves.
 *
 * @java game/rules/play/moves/nonDecision/effect/Effect.java
 */
export abstract class Effect extends NonDecision {
  /**
   * @java game/rules/play/moves/nonDecision/effect/Effect.java — constructor(Then)
   * @param then The effect of the moves.
   */
  public constructor(then: ThenLike | null = null) {
    super(then);
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Effect.java — eval(Context)
   * Returns null in Java as a "trick ludeme" to join the grammar.
   * Concrete subclasses override with real logic.
   */
  public override eval(_ctx: Context): Move[] {
    return [];
  }
}
