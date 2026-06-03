// @java Core/src/game/rules/play/moves/BaseMoves.java

/**
 * Placeholder object for creating default Moves objects without initialisation.
 *
 * @java game/rules/play/moves/BaseMoves.java
 *
 * Java: public class BaseMoves extends Moves
 *   - eval() returns this
 *   - gameFlags() returns 0
 *   - isStatic() returns false
 *   - preprocess() delegates to super
 */

import type { Context } from "../../../../../context.js";
import type { Move } from "../../../../../move.js";
import { Moves } from "./Moves.js";
import type { ThenLike } from "./Moves.js";

/**
 * Minimal concrete Moves — used as a container/placeholder throughout the
 * Java engine wherever a Moves object is needed but no real generation logic
 * is required (e.g. the result accumulator in Effect.eval implementations).
 *
 * @java game/rules/play/moves/BaseMoves.java
 */
export class BaseMoves extends Moves {
  /**
   * @java game/rules/play/moves/BaseMoves.java — constructor(Then)
   * @param then The subsequents of the moves.
   */
  public constructor(then: ThenLike | null = null) {
    super(then);
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/BaseMoves.java — eval(Context)
   * Returns this (the pre-populated moves list).
   */
  public override eval(_ctx: Context): Move[] {
    return this.moves();
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/BaseMoves.java — gameFlags(Game)
   */
  public override gameFlags(): number {
    return 0;
  }

  /**
   * @java game/rules/play/moves/BaseMoves.java — isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }

  /**
   * @java game/rules/play/moves/BaseMoves.java — preprocess(Game)
   */
  public override preprocess(): void {
    super.preprocess();
  }
}
