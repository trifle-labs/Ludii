/**
 * Ends a game based on the payoff of each player.
 *
 * @java game/rules/end/Payoffs.java
 *
 * Java: Payoffs extends Result. Its eval(context) sets each player's payoff
 * (double), then ranks players by payoff (highest = rank 1, using the same
 * iterative algorithm as ByScore). For single-player games, payoff <= 0 means
 * a loss (rank 0), > 0 means a win (rank 1).
 *
 * In the 1:1 path, payoffs are stored as floats in state. We mirror Java's
 * eval logic precisely.
 *
 * @java game/rules/end/Payoffs.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { EndResult, EndRuleFunction, FloatFunction } from "../../../base.js";

/**
 * One payoff entry: player `pid` gets the payoff computed by `payoff`.
 * @java game/util/end/Payoff.java
 */
export interface PayoffEntry {
  readonly pid: number;
  readonly payoff: FloatFunction;
}

/**
 * @java game/rules/end/Payoffs.java — extends Result, implements EndRuleFunction in 1:1
 */
export class Payoffs implements EndRuleFunction {
  /** Per-player payoff definitions. @java Payoffs.finalPayoff */
  private readonly finalPayoff: readonly PayoffEntry[];
  /** Number of players. */
  private readonly numPlayers: number;

  /**
   * @java game/rules/end/Payoffs.java — constructor(Payoff[] finalPayoffs)
   *
   * @param numPlayers  Number of players.
   * @param finalPayoff Per-player payoff entries.
   */
  public constructor(
    numPlayers: number,
    finalPayoff: readonly PayoffEntry[] = [],
  ) {
    this.numPlayers = numPlayers;
    this.finalPayoff = finalPayoff;
  }

  /**
   * @java game/rules/end/Payoffs.java — eval(Context context)
   *
   * 1. Apply payoff values to a local array (Java: context.setPayoff).
   * 2. For 1-player: payoff <= 0 → loss (rank 0.0), > 0 → win (rank 1.0).
   * 3. For n>1: iteratively assign ranks from highest payoff downward.
   * 4. Return EndResult with winner (rank 1.0) and ranking array.
   */
  public eval(ctx: Context): EndResult | null {
    const n = this.numPlayers;

    // Build payoff array (read from state.payoffs[] if available, else 0).
    const stateAny = ctx.state as unknown as { payoffs?: number[] };
    const allPayoffs: number[] = new Array(n + 1).fill(0);
    if (stateAny.payoffs) {
      for (let p = 1; p <= n; p++) {
        allPayoffs[p] = stateAny.payoffs[p] ?? 0;
      }
    }

    // Apply finalPayoff overrides.
    // @java Payoffs.eval:49-58 — context.setPayoff(pid, payoffToSet)
    for (const entry of this.finalPayoff) {
      const v = entry.payoff.eval(ctx);
      if (entry.pid >= 1 && entry.pid <= n) {
        allPayoffs[entry.pid] = v;
      }
    }

    const ranking = new Array<number>(n + 1).fill(0);

    if (n === 1) {
      // @java Payoffs.eval:72-76 — single-player special case
      ranking[1] = allPayoffs[1]! <= 0.0 ? 0.0 : 1.0;
    } else {
      // Iterative max-payoff ranking.
      // @java Payoffs.eval:80-119
      const scratch = [...allPayoffs];
      let numAssigned = 0;
      while (numAssigned < n) {
        let maxPayoff = Number.MIN_SAFE_INTEGER;
        let numMax = 0;
        for (let p = 1; p <= n; p++) {
          const pv = scratch[p] ?? Number.MIN_SAFE_INTEGER;
          if (pv > maxPayoff) { maxPayoff = pv; numMax = 1; }
          else if (pv === maxPayoff) { numMax++; }
        }
        if (maxPayoff === Number.MIN_SAFE_INTEGER) break;
        // @java Payoffs.eval:104 — nextWinRank = ((numAssignedRanks+1)*2 + numMax - 1) / 2
        const nextRank = ((numAssigned + 1) * 2 + numMax - 1) / 2;
        for (let p = 1; p <= n; p++) {
          if ((scratch[p] ?? Number.MIN_SAFE_INTEGER) === maxPayoff) {
            ranking[p] = nextRank;
            scratch[p] = Number.MIN_SAFE_INTEGER; // sentinel
          }
        }
        numAssigned += numMax;
      }
    }

    // Find winner (rank 1.0).
    // @java Payoffs.eval:122-129
    let winner = 0;
    for (let p = 1; p <= n; p++) {
      if (ranking[p] === 1.0) { winner = p; break; }
    }

    return { winner, over: true, ranking };
  }
}
