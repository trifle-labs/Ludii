/**
 * Decision1to1.ts
 *
 * @java game/rules/play/moves/decision/Decision.java
 *
 * Abstract base class for all decision moves. In Java, Decision extends Moves
 * and its eval() returns null (it is a "trick ludeme" for grammar purposes).
 * Concrete subclasses override eval() to produce real move lists.
 *
 * In the 1:1 TS port, this is a structural marker — concrete decision classes
 * implement MovesFunction directly. Decision1to1 provides a typed base so
 * that instanceof checks and class hierarchy match the Java package structure.
 */

import type { Context } from "../../../../../../context.js";
import type { Move } from "../../../../../../move.js";
import type { MovesFunction } from "../../../../../base.js";

/**
 * @java game/rules/play/moves/decision/Decision.java
 *
 * Abstract base for decision ludemes. In Java:
 *   public abstract class Decision extends Moves
 *   public Moves eval(Context context) { return null; }
 *
 * Concrete subclasses override eval() to return real Move[].
 */
export abstract class Decision1to1 implements MovesFunction {
  /**
   * @java game/rules/play/moves/decision/Decision.java — eval(Context)
   * Returns null in Java (grammar trick). Concrete subclasses override.
   */
  public abstract eval(ctx: Context): Move[];
}
