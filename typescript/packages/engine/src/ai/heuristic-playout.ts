/**
 * Java parity: AI/src/search/mcts/playout/HeuristicPlayout.java +
 * Core/src/other/playout/HeuristicSamplingMoveSelector.java —
 * a playout strategy that picks the move leading to the successor
 * state with the highest heuristic score for the mover. Used as
 * an alternative to uniform random rollouts inside MCTS.
 *
 * Ties are broken uniformly at random with the playout's RNG.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { SeededRng } from "../rng.js";
import { type Evaluator, MaterialEvaluator } from "./alpha-beta-ai.js";
import type { PlayoutStrategy } from "./playout.js";

export interface HeuristicPlayoutOptions {
  /** Heuristic evaluator. Defaults to the material count used elsewhere. */
  readonly evaluator?: Evaluator;
  /**
   * Probability of taking a uniform-random move instead of the heuristic
   * argmax. 0 (default) = greedy; useful to nudge above 0 in MCTS rollouts
   * to keep exploration alive.
   */
  readonly epsilon?: number;
}

export class HeuristicPlayout implements PlayoutStrategy {
  public readonly evaluator: Evaluator;
  public readonly epsilon: number;

  public constructor(options: HeuristicPlayoutOptions = {}) {
    this.evaluator = options.evaluator ?? new MaterialEvaluator();
    this.epsilon = Math.max(0, Math.min(1, options.epsilon ?? 0));
  }

  public selectMove(context: Context, rng: SeededRng): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (moves.length === 1) return moves[0];
    if (this.epsilon > 0 && rng.nextFloat() < this.epsilon) {
      return moves[rng.nextInt(moves.length)];
    }
    const mover = context.mover;
    let bestScore = Number.NEGATIVE_INFINITY;
    const bestIndices: number[] = [];
    for (let i = 0; i < moves.length; i += 1) {
      const move = moves[i] as Move;
      const child = context.game.apply(context, move);
      const score = this.evaluator.evaluate(child, mover);
      if (score > bestScore) {
        bestScore = score;
        bestIndices.length = 0;
        bestIndices.push(i);
      } else if (score === bestScore) {
        bestIndices.push(i);
      }
    }
    const pickIdx = bestIndices[rng.nextInt(bestIndices.length)] ?? 0;
    return moves[pickIdx];
  }
}
