/**
 * Activates the swap meta-rule (pie rule).
 *
 * @java game/rules/meta/Swap.java
 *
 * Java: Swap.eval(context) does nothing. Swap.apply(context, legalMoves)
 * adds a SwapPlayers move when usesSwapRule() is true and the move number
 * equals numPlayers - 1 (i.e., after P1's first move, P2 may swap).
 * SwapPlayers requires context.trial().lastTurnMover(mover).
 *
 * In the 1:1 path, Swap is a data class. The apply() logic is deferred
 * (requires trial.lastTurnMover() API and SwapPlayers move generator).
 *
 * @java game/rules/meta/Swap.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/**
 * @java game/rules/meta/Swap.java — extends MetaRule
 */
export class Swap extends MetaRule {
  /**
   * @java game/rules/meta/Swap.java — constructor()
   */
  public constructor() {
    super();
  }

  /**
   * @java game/rules/meta/Swap.java — eval(Context context) { /* Do nothing. *\/ }
   * Java: does nothing.
   */
  public eval(): void {
    // @java Swap.eval: /* Do nothing. */
  }
}
