// @java Core/src/game/rules/play/moves/decision/Decision.java

import type { Context } from "../../../../../../context.js";
import type { Move } from "../../../../../../move.js";
import { Moves, type ThenLike } from "../Moves.js";

/**
 * Defines moves that involve a decision by the player.
 *
 * Faithful 1:1 port of the Java abstract base. Like Java, its `eval` is a
 * grammar trick that returns no moves (concrete decision ludemes — Move, Pass,
 * Propose, Vote, etc. — override it).
 *
 * @java game/rules/play/moves/decision/Decision.java
 */
export abstract class Decision extends Moves {
  /**
   * @param then The subsequents of the moves.
   * @java Decision(Then) — super(then)
   */
  public constructor(then: ThenLike | null = null) {
    super(then);
  }

  /**
   * Trick ludeme into joining the grammar (Java returns null; the TS
   * MovesFunction contract returns an empty move list).
   * @java Decision.eval(Context) — returns null
   */
  public eval(_context: Context): Move[] {
    return [];
  }
}
