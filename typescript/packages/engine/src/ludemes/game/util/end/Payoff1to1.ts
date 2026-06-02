/**
 * Payoff1to1.ts
 * @java game/util/end/Payoff.java
 *
 * Defines a payoff to set when using the (payoffs ...) end rule.
 * Holds a role string and a FloatFunction for the payoff value.
 *
 * This is a data class — no eval(ctx). The (payoffs ...) end rule
 * iterates these to set final payoff values.
 */

import type { FloatFunction } from "../../../base.js";

/**
 * Valid role strings mirror Java's RoleType enum values.
 * @java game/types/play/RoleType.java
 */
export type RoleType1to1 =
  | "Mover" | "Next" | "Prev"
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8"
  | "All" | "Shared" | "Neutral" | "Each" | "Team1" | "Team2";

/**
 * Defines a payoff to set when using the (payoffs ...) end rule.
 * @java game/util/end/Payoff.java
 */
export class Payoff1to1 {
  /** @java Payoff.role */
  private readonly role: RoleType1to1;

  /** @java Payoff.payoff */
  private readonly payoffFn: FloatFunction;

  /**
   * @java game/util/end/Payoff.java — constructor(RoleType role, FloatFunction payoff)
   */
  public constructor(role: RoleType1to1, payoff: FloatFunction) {
    this.role = role;
    this.payoffFn = payoff;
  }

  /** @java Payoff.role() */
  public getRole(): RoleType1to1 {
    return this.role;
  }

  /** @java Payoff.payoff() */
  public payoff(): FloatFunction {
    return this.payoffFn;
  }
}
