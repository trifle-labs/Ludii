/**
 * @java game/rules/phase/NextPhase.java
 *
 * A phase transition condition.
 *
 * Holds:
 *   - who:           player index function (1-based); numPlayers+1 means "Shared/All"
 *   - cond:          BooleanFunction — fires when true
 *   - targetIndex:   resolved index into the phases array (-1 if unresolved)
 *   - targetName:    name of the target phase (null = "next in list, wrapping")
 *
 * Java's NextPhase.eval() returns the target phase index when cond fires,
 * or UNDEFINED (-1) otherwise.
 *
 * @java game/rules/phase/NextPhase.java — eval(context)
 */

import type { BooleanFunction, IntFunction } from "../../../base.js";

export class NextPhase {
  /** Who this transition applies to. @java NextPhase.who() */
  public readonly who: IntFunction;
  /** Condition. @java NextPhase.cond */
  public readonly cond: BooleanFunction;
  /** Resolved target phase index (set after all phases are built). */
  public targetIndex: number;
  /** Name of the target phase (null = wrap to next). @java NextPhase.phaseName() */
  public readonly targetName: string | null;

  /**
   * @java game/rules/phase/NextPhase.java — constructor
   *
   * @param who         IntFunction evaluating to the player index
   * @param cond        BooleanFunction; true triggers the transition
   * @param targetName  Name of the destination phase, or null for "next in list"
   */
  public constructor(
    who: IntFunction,
    cond: BooleanFunction,
    targetName: string | null,
  ) {
    this.who = who;
    this.cond = cond;
    this.targetName = targetName;
    this.targetIndex = -1; // resolved by compiler after all phases are known
  }
}
