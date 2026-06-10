// @java Core/src/game/functions/booleans/is/simple/IsCycle.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Cycle)
 * Returns true if the game is repeating the same set of states three times
 * with exactly the same moves during these states.
 * @java game/functions/booleans/is/simple/IsCycle.java
 */
export class IsCycle1to1 implements BooleanFunction {
  /**
   * @java IsCycle.eval(Context):
   *   trial.previousState().size() >= 3 * sizeCycle
   *   AND last sizeCycle states == previous sizeCycle states == prior sizeCycle states
   */
  public eval(ctx: Context): boolean {
    const previousStates = ctx.trial.previousStates;
    const n = ctx.game.numPlayers;
    const sizeCycle = n * n;

    if (previousStates.length < 3 * sizeCycle) return false;

    const len = previousStates.length;
    // Build cycleToCheck = last sizeCycle entries
    const cycleToCheck: number[] = [];
    for (let i = len - 1; i > (len - 1) - sizeCycle; i--) {
      cycleToCheck.push(previousStates[i]!);
    }

    // Check one loop (the sizeCycle before cycleToCheck)
    let cycleIndex = 0;
    for (let i = len - 1 - sizeCycle; i > (len - 1) - sizeCycle * 2; i--) {
      if (previousStates[i] !== cycleToCheck[cycleIndex]) return false;
      cycleIndex++;
    }

    // Check second loop
    cycleIndex = 0;
    for (let i = len - 1 - sizeCycle * 2; i > (len - 1) - sizeCycle * 3; i--) {
      if (previousStates[i] !== cycleToCheck[cycleIndex]) return false;
      cycleIndex++;
    }

    return true;
  }
}

