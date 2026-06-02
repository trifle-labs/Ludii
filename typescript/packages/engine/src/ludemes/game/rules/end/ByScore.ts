/**
 * Ends a game based on the score of each player.
 *
 * @java game/rules/end/ByScore.java
 *
 * Java: ByScore extends Result. Its eval(context) ranks players by score
 * (highest = rank 1), or by lowest score when misere=true. It calls
 * context.setScore(pid, scoreToSet) for optional finalScore pairs, then
 * assigns rankings via iterative max-score detection, and sets the trial
 * status with the winner (rank 1.0).
 *
 * In the 1:1 path, context.state.scores[] holds the per-player scores.
 * We implement the same iterative ranking algorithm Java uses.
 *
 * @java game/rules/end/ByScore.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, EndResult, EndRuleFunction } from "../../../base.js";

/**
 * Optional score-override entry: set player `pid`'s score to `score` before ranking.
 * Mirrors Java's `game.util.end.Score` helper.
 * @java game/rules/end/ByScore.java — finalScore field (Score[])
 */
export interface FinalScoreEntry {
  /** 1-based player id */
  readonly pid: number;
  /** Score value function */
  readonly score: import("../../../base.js").IntFunction;
}

/**
 * @java game/rules/end/ByScore.java — extends Result, implements EndRuleFunction in 1:1
 */
export class ByScore implements EndRuleFunction {
  /** Optional per-player final score overrides. @java ByScore.finalScore */
  private readonly finalScore: readonly FinalScoreEntry[];
  /** Misere: lowest score wins when true. @java ByScore.misereFn */
  private readonly misereFn: BooleanFunction;
  /** Number of players (known at compile time). */
  private readonly numPlayers: number;

  /**
   * @java game/rules/end/ByScore.java — constructor(Score[] finalScore, BooleanFunction misere)
   *
   * @param numPlayers  Number of players (needed for ranking array).
   * @param finalScore  Optional score overrides per player.
   * @param misereFn    If true, lowest score wins (misere variant).
   */
  public constructor(
    numPlayers: number,
    finalScore: readonly FinalScoreEntry[] = [],
    misereFn: BooleanFunction = { eval: () => false },
  ) {
    this.numPlayers = numPlayers;
    this.finalScore = finalScore;
    this.misereFn   = misereFn;
  }

  /**
   * @java game/rules/end/ByScore.java — eval(Context context)
   *
   * 1. Apply finalScore overrides (if any).
   * 2. Gather all scores from context.state.scores[].
   * 3. Iteratively assign rankings from max (or min if misere) to min.
   * 4. Return EndResult with winner (rank 1.0) and ranking array.
   */
  public eval(ctx: Context): EndResult | null {
    const n = this.numPlayers;
    const stateAny = ctx.state as unknown as { scores?: number[] };
    const scores = stateAny.scores ?? new Array<number>(n + 1).fill(0);

    // Apply optional finalScore overrides.
    // @java ByScore.eval:63-70 — context.setScore(pid, scoreToSet)
    const allScores = [...scores];
    for (const entry of this.finalScore) {
      const v = entry.score.eval(ctx);
      if (entry.pid >= 1 && entry.pid <= n) {
        allScores[entry.pid] = v;
      }
    }

    const misere = this.misereFn.eval(ctx);
    const ranking = new Array<number>(n + 1).fill(0);

    // Iterative ranking algorithm.
    // @java ByScore.eval:85-166 — keep assigning ranks until everyone has one
    const scratch = [...allScores]; // copy, sentinel = MIN/MAX_SAFE_INTEGER when used
    let numAssigned = 0;

    if (!misere) {
      // Normal: highest score = rank 1
      // @java ByScore.eval:89-126
      while (numAssigned < n) {
        let maxScore = Number.MIN_SAFE_INTEGER;
        let numMax = 0;
        for (let p = 1; p <= n; p++) {
          const s = scratch[p] ?? Number.MIN_SAFE_INTEGER;
          if (s > maxScore) { maxScore = s; numMax = 1; }
          else if (s === maxScore) { numMax++; }
        }
        if (maxScore === Number.MIN_SAFE_INTEGER) break;
        // Java: nextWinRank = ((numAssignedRanks + 1.0) * 2.0 + numMax - 1.0) / 2.0
        const nextRank = ((numAssigned + 1) * 2 + numMax - 1) / 2;
        for (let p = 1; p <= n; p++) {
          if ((scratch[p] ?? Number.MIN_SAFE_INTEGER) === maxScore) {
            ranking[p] = nextRank;
            scratch[p] = Number.MIN_SAFE_INTEGER; // sentinel: already assigned
          }
        }
        numAssigned += numMax;
      }
    } else {
      // Misere: lowest score = rank 1
      // @java ByScore.eval:130-166
      while (numAssigned < n) {
        let minScore = Number.MAX_SAFE_INTEGER;
        let numMin = 0;
        for (let p = 1; p <= n; p++) {
          const s = scratch[p] ?? Number.MAX_SAFE_INTEGER;
          if (s < minScore) { minScore = s; numMin = 1; }
          else if (s === minScore) { numMin++; }
        }
        if (minScore === Number.MAX_SAFE_INTEGER) break;
        const nextRank = ((numAssigned + 1) * 2 + numMin - 1) / 2;
        for (let p = 1; p <= n; p++) {
          if ((scratch[p] ?? Number.MAX_SAFE_INTEGER) === minScore) {
            ranking[p] = nextRank;
            scratch[p] = Number.MAX_SAFE_INTEGER; // sentinel: already assigned
          }
        }
        numAssigned += numMin;
      }
    }

    // Find winner (rank 1.0).
    // @java ByScore.eval:168-177
    let winner = 0;
    for (let p = 1; p <= n; p++) {
      if (ranking[p] === 1.0) { winner = p; break; }
    }

    return { winner, over: true, ranking };
  }
}
