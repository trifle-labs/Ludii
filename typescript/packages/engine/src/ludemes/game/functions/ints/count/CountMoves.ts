/**
 * @java game/functions/ints/count/simple/CountMoves.java
 *
 * (count Moves) — returns the number of play moves so far (excluding start
 * placement moves).
 *
 * Java parity: context.trial().moveNumber() = numMoves() - numInitPlacement().
 * In the TS model, trial.moves.length is the count of all applied moves,
 * including start rules. For games without start rules this is identical to
 * Java's moveNumber(). Since the 1:1 path currently doesn't apply start rules
 * as moves to the trial, trial.moves.length is the move number.
 *
 * @java game/functions/ints/count/simple/CountMoves.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";

export class CountMoves implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountMoves.java — eval(Context)
   * Java: context.trial().moveNumber() = numMoves() - numInitPlacement()
   */
  public eval(ctx: Context): number {
    // trial.moves.length = number of moves applied so far (play moves only in 1:1 path)
    return ctx.trial.moves.length;
  }
}
