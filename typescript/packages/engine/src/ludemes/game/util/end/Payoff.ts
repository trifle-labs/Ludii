// @java Core/src/game/util/end/Payoff.java
//
// Defines a payoff to set when using the (payoffs ...) end rule.
// Holds a RoleType and a FloatFunction (lazy evaluation).

import type { FloatFunction } from "../../../base.js";
import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import { type RoleType } from "./RoleType.js";

/**
 * Defines a payoff to set when using the (payoffs ...) end rule.
 *
 * @java game.util.end.Payoff
 */
export class Payoff {
  /** The role of the player. @java Payoff.role */
  public readonly role: RoleType;

  /** The payoff function. @java Payoff.payoff */
  public readonly payoff: FloatFunction;

  /**
   * @java Payoff(RoleType role, FloatFunction payoff)
   */
  public constructor(role: RoleType, payoff: FloatFunction) {
    this.role = role;
    this.payoff = payoff;
  }

  /**
   * Evaluate the payoff for the current context.
   * @java Payoff.payoff().eval(context)
   */
  public evalPayoff(ctx: Context & EvalScratch): number {
    return this.payoff.eval(ctx);
  }
}
