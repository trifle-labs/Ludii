// @java Core/src/game/util/end/Score.java
//
// Defines a score to set when using the (byScore ...) end rule.
// Holds a RoleType and an IntFunction (lazy evaluation).

import type { IntFunction } from "../../../base.js";
import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import { type RoleType } from "./RoleType.js";

/**
 * Defines a score to set when using the (byScore ...) end rule.
 *
 * @java game.util.end.Score
 */
export class Score {
  /** The role of the player. @java Score.role */
  public readonly role: RoleType;

  /** The score function. @java Score.score */
  public readonly score: IntFunction;

  /**
   * @java Score(RoleType role, IntFunction score)
   */
  public constructor(role: RoleType, score: IntFunction) {
    this.role = role;
    this.score = score;
  }

  /**
   * Evaluate the score for the current context.
   * @java Score.score().eval(context)
   */
  public evalScore(ctx: Context & EvalScratch): number {
    return this.score.eval(ctx);
  }
}
