/**
 * Java parity: AI/src/search/flat/OnePlyNoHeuristic.java —
 * Look one move ahead, pick the move whose resulting state has the
 * highest reward for the mover. No heuristic on non-terminal states:
 * everything that hasn't ended is treated as a draw (the midpoint of
 * win and loss). Ties broken at random.
 *
 * Useful as a baseline: stronger than random because it always grabs
 * an immediate win when one exists, but blind beyond a single ply.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { AI, type SelectActionOptions } from "./ai.js";
import { scoreForPlayer } from "./flat-monte-carlo-ai.js";

export interface OnePlyNoHeuristicOptions {
  /** Seed for tie-break RNG. */
  readonly seed?: number;
}

export class OnePlyNoHeuristic extends AI {
  private rng: SeededRng;

  public constructor(options: OnePlyNoHeuristicOptions = {}) {
    super();
    this.friendlyName = "One-Ply (No Heuristic)";
    this.rng = new SeededRng(options.seed ?? 0x1f1f1f);
  }

  public withSeed(seed: number): this {
    this.rng = new SeededRng(seed);
    return this;
  }

  public override selectAction(
    context: Context,
    _options: SelectActionOptions = {},
  ): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    if (moves.length === 1) return moves[0];

    const mover = context.mover;
    let bestScore = Number.NEGATIVE_INFINITY;
    const bestMoves: Move[] = [];

    for (const move of moves) {
      const child = context.game.apply(context, move);
      // For terminal states, use the actual outcome; otherwise treat as
      // draw (0). Java uses the midpoint of next-win/next-loss bounds —
      // for win/draw/loss in [-1, 0, +1] that midpoint is 0.
      const score = child.over ? scoreForPlayer(child, mover) : 0;
      if (score > bestScore) {
        bestScore = score;
        bestMoves.length = 0;
        bestMoves.push(move);
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    const pick = this.rng.nextInt(bestMoves.length);
    return bestMoves[pick];
  }
}
