// @java Core/src/game/functions/intArray/iteraror/Team.java

/**
 * Returns the team iterator — the current team being iterated over by
 * a surrounding (forEach Team ...) ludeme.
 *
 * @java game/functions/intArray/iteraror/Team.java
 *
 * Java parity: Team.eval(context) returns context.team() — an int[] containing
 * the player indices of the current team being iterated. In the TS 1:1 path
 * this is stored in a custom eval-scratch slot _evalTeam on the Context.
 * When not inside a forEach Team iteration, an empty array is returned.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import { BaseIntArrayFunction } from "../BaseIntArrayFunction.js";

/**
 * Extended eval-scratch with a team slot.
 * @java other/context/Context.java — team() / setTeam(int[])
 */
export interface EvalScratchWithTeam extends EvalScratch {
  /**
   * The current team player-index array set by a surrounding forEach Team
   * iteration. Undefined when not in a team iteration context.
   * @java Context.team()
   */
  _evalTeam?: number[];
}

/**
 * @java game.functions.intArray.iteraror.Team
 */
export class Team extends BaseIntArrayFunction {
  /**
   * @java Team()
   */
  public constructor() {
    super();
  }

  /**
   * @java Team.eval(Context) — returns context.team()
   * Returns the int[] of player indices in the current team being iterated.
   * When not inside a forEach Team iteration, returns an empty array.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const teamCtx = ctx as Context & EvalScratchWithTeam;
    return teamCtx._evalTeam ?? [];
  }

  public override toString(): string {
    return "Team()";
  }
}
