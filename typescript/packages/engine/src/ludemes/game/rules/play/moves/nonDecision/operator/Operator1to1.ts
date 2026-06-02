/**
 * Operator1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operator/Operator.java
 *
 * Abstract base class for move-combination operators (And, Or, If, Priority,
 * Append, ForEach variants, etc.). In Java:
 *
 *   public abstract class Operator extends NonDecision
 *   public Moves eval(Context context) { return null; }
 *
 * Operators combine two or more sub-move-lists into a single list.
 * Concrete subclasses override eval() to produce real Move arrays.
 *
 * In the 1:1 TS port this is a structural marker class.
 * Concrete operators implement MovesFunction directly.
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";

/**
 * @java game/rules/play/moves/nonDecision/operator/Operator.java
 *
 * Abstract operator — combines sub-move-lists. In Java:
 *   public abstract class Operator extends NonDecision
 *   public Moves eval(Context context) { return null; }
 *
 * Concrete subclasses override eval().
 */
export abstract class Operator1to1 implements MovesFunction {
  /**
   * @java game/rules/play/moves/nonDecision/operator/Operator.java — eval(Context)
   * Returns null in Java (grammar trick). Concrete subclasses override.
   */
  public abstract eval(ctx: Context): Move[];
}
