/**
 * Forbids moves that would cause the mover to immediately lose.
 *
 * @java game/rules/meta/no/simple/NoSuicide.java
 *
 * Java: NoSuicide.eval(context) sets context.game().metaRules().setNoSuicide(true).
 * NoSuicide.apply(context, move) applies the move to a TempContext and checks
 * if the mover is still active (and not in the losers set). If the mover would
 * lose, the move is forbidden.
 * This requires TempContext / game.applyInternal() absent from the 1:1 path.
 *
 * In the 1:1 path, NoSuicide is a data class. The apply() filter is deferred.
 *
 * @java game/rules/meta/no/simple/NoSuicide.java — eval(Context context)
 */

import { MetaRule } from "../../MetaRule.js";

/**
 * @java game/rules/meta/no/simple/NoSuicide.java — extends MetaRule
 */
export class NoSuicide extends MetaRule {
  /**
   * @java game/rules/meta/no/simple/NoSuicide.java — constructor()
   */
  public constructor() {
    super();
  }

  /**
   * @java game/rules/meta/no/simple/NoSuicide.java — eval(Context context)
   * Java: context.game().metaRules().setNoSuicide(true).
   * In the 1:1 path: no-op.
   */
  public eval(): void {
    // @java NoSuicide.eval: context.game().metaRules().setNoSuicide(true)
    // No-op in 1:1 path.
  }
}
