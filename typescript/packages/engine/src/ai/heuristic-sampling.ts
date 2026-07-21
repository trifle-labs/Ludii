/**
 * Java parity: AI/src/search/flat/HeuristicSampling.java —
 * a flat heuristic-sampled search. Each turn pick a fraction of the
 * legal moves at random, apply each, and choose the one whose resulting
 * state has the highest heuristic score for the mover. Optionally
 * descend one more level when applying a move leaves the same mover
 * on play (move-again / multi-step turns) — capped at depth 10.
 *
 * Compared to flat Monte-Carlo this is cheaper per move (no playout)
 * but relies on the heuristic being directionally correct.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { AI, type SelectActionOptions } from "./ai.js";
import { type Evaluator, MaterialEvaluator } from "./alpha-beta-ai.js";

/** Decisive bonus / penalty for terminal states discovered mid-search. */
const WIN_SCORE = 10_000;
const PARANOID_OPP_WIN_SCORE = 10_000;
/** Hard cap on the continuation recursion (Java parity). */
const MAX_CONTINUATION_DEPTH = 10;

export interface HeuristicSamplingOptions {
  /**
   * Denominator of the sampling fraction: sample ⌈N / fraction⌉ moves
   * (clamped to ≥2 near root, ≥1 deeper). Default 2 — half the moves.
   */
  readonly fraction?: number;
  /** When true (default), recurse on same-mover follow-ups (multi-step turns). */
  readonly continuation?: boolean;
  /** Heuristic evaluator. Defaults to the material count used elsewhere. */
  readonly evaluator?: Evaluator;
  /** Seed for the move-sampling RNG. */
  readonly seed?: number;
}

export class HeuristicSampling extends AI {
  public readonly fraction: number;
  public readonly continuation: boolean;
  public readonly evaluator: Evaluator;
  private rng: SeededRng;

  public constructor(options: HeuristicSamplingOptions = {}) {
    super();
    this.fraction = Math.max(1, options.fraction ?? 2);
    this.continuation = options.continuation ?? true;
    this.evaluator = options.evaluator ?? new MaterialEvaluator();
    this.rng = new SeededRng(options.seed ?? 0xa5a5a5);
    this.friendlyName = `HS (1/${this.fraction})${this.continuation ? "*" : ""}`;
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
    return this.evaluateMoves(context, 1).move;
  }

  private evaluateMoves(
    context: Context,
    depth: number,
  ): { move: Move; score: number } {
    const moves = this.selectMoves(context, depth);
    const mover = context.mover;
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestMove: Move = moves[0] as Move;

    for (const move of moves) {
      const child = context.game.apply(context, move);

      // Immediate terminal: a win is the dominant choice, a loss is skipped.
      if (child.over) {
        const winner = child.winner;
        if (winner === mover) {
          return { move, score: WIN_SCORE };
        }
        if (winner !== 0 && winner !== mover) {
          continue; // losing branch — skip
        }
        // Draw — score 0; fall through to comparison.
        const drawScore = 0;
        if (drawScore > bestScore) {
          bestScore = drawScore;
          bestMove = move;
        }
        continue;
      }

      let score: number;
      if (
        this.continuation &&
        child.mover === mover &&
        depth <= MAX_CONTINUATION_DEPTH
      ) {
        score = this.evaluateMoves(child, depth + 1).score;
      } else {
        // Heuristic from mover's POV; subtract opponents' heuristics.
        score = this.evaluator.evaluate(child, mover);
        const numPlayers = child.game.numPlayers;
        for (let p = 1; p <= numPlayers; p += 1) {
          if (p === mover) continue;
          if (child.over && child.winner === p) {
            score -= PARANOID_OPP_WIN_SCORE;
          } else {
            score -= this.evaluator.evaluate(child, p);
          }
        }
        // Tiny random tie-breaker, same as the Java implementation.
        score += this.rng.nextInt(1000) / 1_000_000;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return { move: bestMove, score: bestScore };
  }

  private selectMoves(context: Context, depth: number): Move[] {
    const all = [...context.game.moves(context)];
    const minMoves = depth < 3 ? 2 : 1;
    const scalar =
      depth < 3 ? 1 / this.fraction : 1 / (this.fraction * 2 ** (depth - 2));
    const target = Math.max(minMoves, Math.floor((all.length + 1) * scalar));
    if (target >= all.length) return all;
    const picked: Move[] = [];
    while (picked.length < target && all.length > 0) {
      const r = this.rng.nextInt(all.length);
      picked.push(all[r] as Move);
      // O(1) swap-remove.
      const last = all.pop();
      if (r < all.length && last !== undefined) all[r] = last;
    }
    return picked;
  }
}
