/**
 * Java parity: AI/src/search/flat/FlatMonteCarlo.java —
 * sample N random playouts for each legal move and pick the move with
 * the highest average score for the mover. No tree, no UCB — flat.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { AI, type SelectActionOptions } from "./ai.js";
import { type PlayoutStrategy, RandomPlayout } from "./playout.js";

export interface FlatMonteCarloAIOptions {
  /** Per-move playouts when neither maxSeconds nor maxIterations is set. */
  readonly playoutsPerMove?: number;
  /** Hard cap on playout length (moves) to avoid runaway games. */
  readonly maxPlayoutLength?: number;
  /** Playout strategy. Defaults to uniform-random. */
  readonly playout?: PlayoutStrategy;
  /** Seed for the internal RNG. */
  readonly seed?: number;
}

const DEFAULT_PLAYOUTS_PER_MOVE = 16;
const DEFAULT_MAX_PLAYOUT_LENGTH = 256;

export class FlatMonteCarloAI extends AI {
  private readonly playoutsPerMove: number;
  private readonly maxPlayoutLength: number;
  private readonly playout: PlayoutStrategy;
  private rng: SeededRng;

  public constructor(options: FlatMonteCarloAIOptions = {}) {
    super();
    this.friendlyName = "Flat MC";
    this.playoutsPerMove = options.playoutsPerMove ?? DEFAULT_PLAYOUTS_PER_MOVE;
    this.maxPlayoutLength =
      options.maxPlayoutLength ?? DEFAULT_MAX_PLAYOUT_LENGTH;
    this.playout = options.playout ?? new RandomPlayout();
    this.rng = new SeededRng(options.seed ?? 0xfee1900d);
  }

  public override selectAction(
    context: Context,
    options: SelectActionOptions = {},
  ): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (moves.length === 1) return moves[0];

    const mover = context.mover;
    const totalIters = options.maxIterations ?? -1;
    const start = Date.now();
    const deadlineMs =
      options.maxSeconds && options.maxSeconds > 0
        ? options.maxSeconds * 1000
        : Number.POSITIVE_INFINITY;

    const wins = new Float64Array(moves.length);
    const visits = new Uint32Array(moves.length);

    // Round-robin over moves so every move gets samples first.
    let iter = 0;
    while (true) {
      for (let i = 0; i < moves.length; i += 1) {
        if (Date.now() - start > deadlineMs) {
          return this.argmax(moves, wins, visits);
        }
        if (totalIters >= 0 && iter >= totalIters) {
          return this.argmax(moves, wins, visits);
        }
        const child = context.game.apply(context, moves[i] as Move);
        const result = this.playoutTo(child, mover);
        wins[i] = (wins[i] ?? 0) + result;
        visits[i] = (visits[i] ?? 0) + 1;
        iter += 1;
      }

      // No time/iteration limit set ⇒ stop after the configured count.
      if (totalIters < 0 && deadlineMs === Number.POSITIVE_INFINITY) {
        const minVisits = this.minVisits(visits);
        if (minVisits >= this.playoutsPerMove) {
          return this.argmax(moves, wins, visits);
        }
      }
    }
  }

  /**
   * Run one playout from `context`. Returns the mover's reward in
   * [-1, +1].
   */
  private playoutTo(context: Context, rootMover: number): number {
    let cur = context;
    for (let depth = 0; depth < this.maxPlayoutLength; depth += 1) {
      if (cur.over) break;
      const m = this.playout.selectMove(cur, this.rng);
      if (m === undefined) break;
      cur = cur.game.apply(cur, m);
    }
    return scoreForPlayer(cur, rootMover);
  }

  private argmax(
    moves: readonly Move[],
    wins: Float64Array,
    visits: Uint32Array,
  ): Move {
    let bestIdx = 0;
    let bestMean = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < moves.length; i += 1) {
      const v = visits[i] ?? 0;
      const mean = v > 0 ? (wins[i] ?? 0) / v : Number.NEGATIVE_INFINITY;
      if (mean > bestMean) {
        bestMean = mean;
        bestIdx = i;
      }
    }
    return moves[bestIdx] as Move;
  }

  private minVisits(visits: Uint32Array): number {
    let m = Number.POSITIVE_INFINITY;
    for (let i = 0; i < visits.length; i += 1) {
      const v = visits[i] ?? 0;
      if (v < m) m = v;
    }
    return m;
  }
}

/**
 * Map a finished context to a reward in [-1, +1] for `player`.
 * Win = +1, loss = -1, draw / not yet over = 0.
 */
export function scoreForPlayer(context: Context, player: number): number {
  if (!context.over) return 0;
  const winner = context.winner;
  if (winner === 0) return 0;
  return winner === player ? 1 : -1;
}
