/**
 * Java parity: AI/src/search/mcts/playout/NST.java.
 *
 * Bigram variant of MAST. Picks the next playout move via softmax over
 * the running mean reward of the (previous-move, candidate-move) pair.
 * Falls back to the unigram (MAST) mean when no bigram data exists.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { SeededRng } from "../rng.js";
import type { BigramStats, MoveStats } from "./move-stats.js";
import type { PlayoutStrategy } from "./playout.js";

export interface NSTPlayoutOptions {
  readonly stats: MoveStats;
  readonly bigramStats: BigramStats;
  readonly temperature?: number;
  readonly epsilon?: number;
}

/**
 * Tracks the previously-played move's hash across calls so the strategy
 * can key bigram updates. Reset by calling `resetHistory()` at the start
 * of each rollout.
 */
export class NSTPlayout implements PlayoutStrategy {
  private readonly stats: MoveStats;
  private readonly bigramStats: BigramStats;
  private readonly temperature: number;
  private readonly epsilon: number;
  private prevHash = 0;

  public constructor(options: NSTPlayoutOptions) {
    this.stats = options.stats;
    this.bigramStats = options.bigramStats;
    this.temperature = Math.max(1e-6, options.temperature ?? 1);
    this.epsilon = Math.max(0, Math.min(1, options.epsilon ?? 0.1));
  }

  public resetHistory(): void {
    this.prevHash = 0;
  }

  public selectMove(context: Context, rng: SeededRng): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (moves.length === 1) {
      this.prevHash = (moves[0] as Move).hash();
      return moves[0];
    }
    if (rng.nextFloat() < this.epsilon) {
      const pick = moves[rng.nextInt(moves.length)] as Move;
      this.prevHash = pick.hash();
      return pick;
    }
    let maxVal = Number.NEGATIVE_INFINITY;
    const vals: number[] = new Array(moves.length);
    for (let i = 0; i < moves.length; i += 1) {
      const m = moves[i] as Move;
      const bigramVisits = this.bigramStats.visits(this.prevHash, m);
      const v =
        bigramVisits > 0
          ? this.bigramStats.mean(this.prevHash, m) / this.temperature
          : this.stats.mean(m) / this.temperature;
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
      const pick = moves[rng.nextInt(moves.length)] as Move;
      this.prevHash = pick.hash();
      return pick;
    }
    let r = rng.nextFloat() * total;
    for (let i = 0; i < vals.length; i += 1) {
      r -= vals[i] as number;
      if (r <= 0) {
        const pick = moves[i] as Move;
        this.prevHash = pick.hash();
        return pick;
      }
    }
    const fallback = moves[moves.length - 1] as Move;
    this.prevHash = fallback.hash();
    return fallback;
  }
}
