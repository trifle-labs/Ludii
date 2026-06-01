/**
 * @java game/rules/end/Result.java Result
 *
 * Data holder for end-game result: who wins/loses/draws.
 *
 * Java parity: Result holds a RoleType (who) and a ResultType (Win/Loss/Draw).
 * Used by If end rules to express the outcome when the condition fires.
 */

import type { RoleType, ResultType } from "../../../base.js";

export class Result {
  /**
   * @java game/rules/end/Result.java — constructor
   */
  public constructor(
    public readonly who: RoleType,
    public readonly result: ResultType,
  ) {}

  /**
   * Resolve `who` to a concrete 1-based player index.
   * @java game/types/play/RoleType.java — toIntFunction
   */
  public resolveWho(mover: number, numPlayers: number): number {
    switch (this.who) {
      case "Mover": return mover;
      case "Next":  return (mover % numPlayers) + 1;
      case "P1":    return 1;
      case "P2":    return 2;
      case "All":   return 0;
      default:      return mover;
    }
  }
}
