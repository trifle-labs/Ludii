// @java Core/src/game/rules/play/moves/nonDecision/operator/Operator.java

/**
 * Defines operations that combine lists of moves, then optionally perform
 * some additional effects.
 *
 * The input moves can be decision moves or effect moves (or both).
 *
 * @java game/rules/play/moves/nonDecision/operator/Operator.java
 *
 * Java parity:
 *   public abstract class Operator extends NonDecision
 *   public Operator(final Then then) { super(then); }
 *   public Moves eval(Context) { return null; }  // grammar trick
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";

/**
 * Abstract base for operator ludemes (combine lists of moves).
 *
 * @java game/rules/play/moves/nonDecision/operator/Operator.java
 *
 * In Java:
 *   public abstract class Operator extends NonDecision
 *   eval(Context) returns null — grammar trick.
 * Concrete subclasses override eval() to return real Move[].
 */
export abstract class Operator implements MovesFunction {
  /**
   * @java game/rules/play/moves/nonDecision/operator/Operator.java — eval(Context)
   *
   * Returns null in Java (grammar trick). Concrete subclasses override.
   */
  public abstract eval(ctx: Context): Move[];
}
