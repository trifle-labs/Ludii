/**
 * Activates the automove meta-rule.
 *
 * @java game/rules/meta/Automove.java
 *
 * Java: Automove.eval(context) sets context.game().metaRules().setAutomove(true).
 * Automove.apply() then re-evaluates moves after each move and forces any unique
 * single-to-site move automatically. This requires a MoveUtilities.chainRuleCrossProduct
 * call and iterative re-evaluation of the current phase — absent from the 1:1 path.
 *
 * In the 1:1 path, Automove is a data class that records the flag. The full
 * apply() logic is deferred.
 *
 * @java game/rules/meta/Automove.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/**
 * @java game/rules/meta/Automove.java — extends MetaRule
 */
export class Automove extends MetaRule {
  /**
   * @java game/rules/meta/Automove.java — constructor()
   */
  public constructor() {
    super();
  }

  /**
   * @java game/rules/meta/Automove.java — eval(Context context)
   * Java: context.game().metaRules().setAutomove(true).
   * In the 1:1 path: no MetaRules object; this is a no-op data class.
   */
  public eval(): void {
    // @java Automove.eval: context.game().metaRules().setAutomove(true)
    // No-op in 1:1 path — MetaRules flags not tracked.
  }
}
