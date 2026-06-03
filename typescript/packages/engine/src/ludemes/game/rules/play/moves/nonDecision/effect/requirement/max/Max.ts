// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/Max.java
/**
 * Filters a list of legal moves to keep only the moves allowing the maximum
 * number of moves in a turn.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/requirement/max/Max.java
 *
 * @remarks This is a factory class — instantiation is done via static construct()
 *          methods. The eval() on the Max class itself should never be called
 *          directly (Java throws UnsupportedOperationException).
 */

import type { Context } from "../../../../../../../../../context.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../move.js";
import type { Then } from "../../Then.js";
import { MaxDistance } from "./distance/MaxDistance.js";

/** @java MaxMovesType enum values */
export type MaxMovesType = "Captures" | "Moves";

/** @java MaxDistanceType enum values */
export type MaxDistanceType = "Distance";

export class Max implements MovesFunction {
  private constructor() {
    // @java Max.java:102-105 — private constructor, never instantiated directly
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/Max.java — construct(MaxMovesType, ...)
   *
   * For getting the moves with the max captures or the max number of legal moves.
   *
   * @param maxType    The type of property to maximise.
   * @param withValue  If true, the capture has to maximise the values of the capturing pieces too.
   * @param moves      The moves to filter.
   * @param then       The moves applied after that move is applied.
   */
  public static construct(
    maxType: MaxMovesType,
    withValue: BooleanFunction | null,
    moves: MovesFunction,
    then: Then | null,
  ): MovesFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/Max.java — construct(MaxDistanceType, ...)
   *
   * For getting the moves with the max distance.
   *
   * @param maxType   The type of property to maximise.
   * @param trackName The name of the track.
   * @param owner     The role type of the track owner.
   * @param moves     The moves to filter.
   * @param then      The moves applied after that move is applied.
   */
  public static construct(
    maxType: MaxDistanceType,
    trackName: string | null,
    owner: string | null,
    moves: MovesFunction,
    then: Then | null,
  ): MovesFunction;

  public static construct(
    maxType: MaxMovesType | MaxDistanceType,
    ...args: unknown[]
  ): MovesFunction {
    if (maxType === "Distance") {
      // @java Max.java:80-98 — MaxDistanceType.Distance case
      const [trackName, owner, moves, then] = args as [string | null, string | null, MovesFunction, Then | null];
      return new MaxDistance(trackName, owner, moves, then);
    }

    // @java Max.java:44-63 — MaxMovesType cases
    switch (maxType) {
      case "Captures":
        // Delegate to MaxCaptures — not implemented as separate class in TS yet
        throw new Error("not yet wired: Max(Captures) requires MaxCaptures implementation");
      case "Moves":
        // Delegate to MaxMoves — not implemented as separate class in TS yet
        throw new Error("not yet wired: Max(Moves) requires MaxMoves implementation");
      default:
        throw new Error(`Max(): Unknown MaxMovesType: ${String(maxType)}`);
    }
  }

  /**
   * @java Max.java:113 — eval() should never be called on Max directly
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Max.eval(): Should never be called directly.");
  }
}
