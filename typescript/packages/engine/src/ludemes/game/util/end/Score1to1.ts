/**
 * Score1to1.ts
 * @java game/util/end/Score.java
 *
 * Defines a score to set when using the (byScore ...) end rule.
 * Holds a role string and an IntFunction for the score value.
 *
 * This is a data class — no eval(ctx). The (byScore ...) end rule
 * iterates these to determine final scores.
 */

import type { IntFunction } from "../../../base.js";
import type { RoleType1to1 } from "./Payoff1to1.js";

/**
 * Defines a score to set when using the (byScore ...) end rule.
 * @java game/util/end/Score.java
 */
export class Score1to1 {
  /** @java Score.role */
  private readonly role: RoleType1to1;

  /** @java Score.score */
  private readonly scoreFn: IntFunction;

  /**
   * @java game/util/end/Score.java — constructor(RoleType role, IntFunction score)
   */
  public constructor(role: RoleType1to1, score: IntFunction) {
    this.role = role;
    this.scoreFn = score;
  }

  /** @java Score.role() */
  public getRole(): RoleType1to1 {
    return this.role;
  }

  /** @java Score.score() */
  public score(): IntFunction {
    return this.scoreFn;
  }
}
