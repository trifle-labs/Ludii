/**
 * Java parity: AI/src/search/mcts/playout/MAST.java.
 *
 * Picks playout moves via softmax-temperature over the running per-move
 * mean reward recorded in a shared `MoveStats`. The first time a move is
 * seen it has mean 0 (so a uniform prior softmax). With ε > 0 we mix in
 * uniform random for forced exploration.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { SeededRng } from "../rng.js";
import type { MoveStats } from "./move-stats.js";
import type { PlayoutStrategy } from "./playout.js";

export interface MASTPlayoutOptions {
  readonly stats: MoveStats;
  /** Softmax temperature. Higher = closer to uniform; lower = greedier. */
  readonly temperature?: number;
  /** ε ∈ [0, 1] for uniform-random forced exploration. */
  readonly epsilon?: number;
}

export class MASTPlayout implements PlayoutStrategy {
  private readonly stats: MoveStats;
  private readonly temperature: number;
  private readonly epsilon: number;

  public constructor(options: MASTPlayoutOptions) {
    this.stats = options.stats;
    this.temperature = Math.max(1e-6, options.temperature ?? 1);
    this.epsilon = Math.max(0, Math.min(1, options.epsilon ?? 0.1));
  }

  public selectMove(context: Context, rng: SeededRng): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (moves.length === 1) return moves[0];
    if (rng.nextFloat() < this.epsilon) {
      return moves[rng.nextInt(moves.length)];
    }
    // Softmax over per-move means.
    let maxVal = Number.NEGATIVE_INFINITY;
    const vals: number[] = new Array(moves.length);
    for (let i = 0; i < moves.length; i += 1) {
      const m = moves[i] as Move;
      const v = this.stats.mean(m) / this.temperature;
      vals[i] = v;
      if (v > maxVal) maxVal = v;
    }
    let total = 0;
    for (let i = 0; i < vals.length; i += 1) {
      const e = Math.exp((vals[i] as number) - maxVal);
      vals[i] = e;
      total += e;
    }
    if (total <= 0 || !Number.isFinite(total)) {
      return moves[rng.nextInt(moves.length)];
    }
    let r = rng.nextFloat() * total;
    for (let i = 0; i < vals.length; i += 1) {
      r -= vals[i] as number;
      if (r <= 0) return moves[i];
    }
    return moves[moves.length - 1];
  }
}
