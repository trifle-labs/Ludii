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
import type { Player } from "../../util/moves/Player.js";

type RoleTypeName = string;

const TRUE_FUNCTION: BooleanFunction = {
  eval: () => true,
};

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
   * @param role         @Opt @Or RoleType of the player [Shared]
   * @param indexPlayer  @Opt @Or Player index of the player
   * @param cond         @Opt BooleanFunction; true triggers the transition
   * @param phaseName    @Opt name of the destination phase, or null for "next in list"
   */
  public constructor(
    role?: RoleTypeName | null,
    indexPlayer?: Player | null,
    cond?: BooleanFunction | null,
    phaseName?: string | null,
  ) {
    let numNonNull = 0;
    if (role !== null && role !== undefined) numNonNull++;
    if (indexPlayer !== null && indexPlayer !== undefined) numNonNull++;

    if (numNonNull > 1) {
      throw new IllegalArgumentException("Zero or one Or parameter must be non-null.");
    }

    this.cond = cond ?? TRUE_FUNCTION;
    this.targetName = phaseName ?? null;
    this.targetIndex = -1; // resolved by compiler after all phases are known

    if (indexPlayer !== null && indexPlayer !== undefined) {
      this.who = indexPlayer.index();
    } else if (role !== null && role !== undefined) {
      this.who = roleToIntFunction(role);
    } else {
      this.who = roleToIntFunction("Shared");
    }
  }

  public phaseName(): string | null {
    return this.targetName;
  }
}

class IllegalArgumentException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "IllegalArgumentException";
  }
}

function roleToIntFunction(role: RoleTypeName): IntFunction {
  return {
    eval: (ctx) => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? 0;
      if (role === "Shared" || role === "All" || role === "Each") return ctx.game.numPlayers + 1;
      if (/^P\d+$/.test(role)) return Number(role.slice(1));
      return 0;
    },
  };
}
