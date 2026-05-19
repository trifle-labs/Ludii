/**
 * Java parity:
 * - AI/src/search/mcts/playout/PlayoutStrategy.java
 * - AI/src/search/mcts/playout/RandomPlayout.java
 *
 * A playout strategy decides which move to play in the rollout phase
 * (i.e. away from the search tree). The TS port models the strategy as
 * a single move-picker.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { SeededRng } from "../rng.js";

export interface PlayoutStrategy {
  /**
   * Pick a move from the legal moves available at `context`. Return
   * `undefined` only when there are no legal moves.
   */
  selectMove(context: Context, rng: SeededRng): Move | undefined;
}

/** Pick a legal move uniformly at random. */
export class RandomPlayout implements PlayoutStrategy {
  public selectMove(context: Context, rng: SeededRng): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    return moves[rng.nextInt(moves.length)];
  }
}

export interface BiasedPlayoutOptions {
  /**
   * `epsilon` ∈ [0, 1]. With probability `epsilon` we pick uniformly at
   * random; otherwise we pick the move with the highest static score.
   */
  readonly epsilon?: number;
  /**
   * Static evaluator for a move in a given context. Higher = better for
   * the side to move. Default: every move scores 0 (degenerates to
   * uniform random).
   */
  readonly score?: (context: Context, move: Move) => number;
}

/**
 * ε-greedy playout that mixes a heuristic move-selector with uniform
 * random. Java parity: `AI/src/playout_move_selectors/EpsilonGreedyWrapper.java`.
 */
export class BiasedPlayout implements PlayoutStrategy {
  private readonly epsilon: number;
  private readonly score: (context: Context, move: Move) => number;

  public constructor(options: BiasedPlayoutOptions = {}) {
    this.epsilon = Math.max(0, Math.min(1, options.epsilon ?? 0.1));
    this.score = options.score ?? (() => 0);
  }

  public selectMove(context: Context, rng: SeededRng): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (rng.nextFloat() < this.epsilon) {
      return moves[rng.nextInt(moves.length)];
    }
    let bestScore = -Infinity;
    let best: Move | undefined;
    for (const move of moves) {
      const s = this.score(context, move);
      if (s > bestScore) {
        bestScore = s;
        best = move;
      }
    }
    return best ?? moves[0];
  }
}
