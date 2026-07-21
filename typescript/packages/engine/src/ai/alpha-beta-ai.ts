/**
 * Java parity: AI/src/search/minimax/AlphaBetaSearch.java — alpha-beta
 * minimax with iterative deepening.
 *
 * The TS port focuses on the algorithmic core; the Java surface's
 * heuristic-loading metadata machinery, training-data export, and
 * extensive bookkeeping are left out. What's kept:
 *
 *   - Classical negamax-style alpha-beta with α/β pruning
 *   - Iterative deepening up to `maxDepth` (or until time/iteration
 *     budget exhausts)
 *   - A transposition table keyed on `State.hash()` + remaining depth,
 *     returning EXACT/LOWER/UPPER bounds (TT cutoffs respect bound type)
 *   - A pluggable evaluator (`Evaluator`); the default is a material-style
 *     "owned cells" count from the current mover's perspective
 *   - Paranoid extension for >2 players (all non-root players are minimisers
 *     of the root mover's score)
 *
 * Terminal/cutoff outputs from the evaluator are real numbers; reaching
 * a final game state returns ±WIN_SCORE so deeper wins/losses prune
 * shorter ones.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { AI, type SelectActionOptions } from "./ai.js";

export interface Evaluator {
  /** Score `context` from `rootPlayer`'s point of view. */
  evaluate(context: Context, rootPlayer: number): number;
}

export interface AlphaBetaAIOptions {
  /**
   * Default depth limit when neither `maxSeconds` nor `maxIterations` is
   * supplied to selectAction. Iterative deepening always grows up to
   * this value (or smaller — whichever budget hits first).
   */
  readonly defaultDepth?: number;
  /** Evaluator used at depth-cutoff nodes. Defaults to material count. */
  readonly evaluator?: Evaluator;
  /** Transposition-table size in entries. Default 1 << 16 (~64k). */
  readonly transpositionTableSize?: number;
  /**
   * If true (default), order the root moves at each iteration by the
   * previous iteration's best-known score, which yields ~order-of-magnitude
   * speedups in well-pruning games.
   */
  readonly orderRootMoves?: boolean;
}

const WIN_SCORE = 1_000_000;
/** Bonus per ply of remaining depth so quicker wins / slower losses win. */
const DEPTH_BONUS = 1;

const DEFAULT_DEPTH = 4;
const DEFAULT_TT_SIZE = 1 << 16;

type Bound = "exact" | "lower" | "upper";

interface TTEntry {
  readonly hash: number;
  readonly depth: number;
  readonly score: number;
  readonly bound: Bound;
  readonly bestMoveIndex: number;
}

/**
 * Default evaluator: count cells owned by `rootPlayer` minus cells owned
 * by everyone else. Works as a coarse material heuristic for placement
 * and territory-style games on a flat board; for games where state.cells
 * is unused (dice games, etc.) it falls back to score.
 */
export class MaterialEvaluator implements Evaluator {
  public evaluate(context: Context, rootPlayer: number): number {
    const state = context.state;
    let mine = 0;
    let theirs = 0;
    for (const owner of state.cells) {
      if (owner === rootPlayer) mine += 1;
      else if (owner !== 0) theirs += 1;
    }
    if (mine === 0 && theirs === 0) {
      // No cells in play — use score channel. scores is 1-indexed with
      // entry 0 reserved for the neutral player.
      const scores = state.scores;
      const myScore = scores[rootPlayer] ?? 0;
      let opp = 0;
      for (let p = 1; p < scores.length; p += 1) {
        if (p !== rootPlayer) opp += scores[p] ?? 0;
      }
      return myScore - opp;
    }
    return mine - theirs;
  }
}

export class AlphaBetaAI extends AI {
  public readonly defaultDepth: number;
  public readonly evaluator: Evaluator;
  public readonly orderRootMoves: boolean;

  /** Plain array TT — keyed by `hash mod size`. */
  private readonly tt: (TTEntry | undefined)[];
  private readonly ttSize: number;

  /** Statistics from the most recent search (for tests / observability). */
  public lastDepthReached = 0;
  public lastNodesVisited = 0;

  public constructor(options: AlphaBetaAIOptions = {}) {
    super();
    this.friendlyName = "AlphaBeta";
    this.defaultDepth = options.defaultDepth ?? DEFAULT_DEPTH;
    this.evaluator = options.evaluator ?? new MaterialEvaluator();
    this.ttSize = Math.max(
      1,
      options.transpositionTableSize ?? DEFAULT_TT_SIZE,
    );
    this.tt = new Array<TTEntry | undefined>(this.ttSize);
    this.orderRootMoves = options.orderRootMoves ?? true;
  }

  public override selectAction(
    context: Context,
    options: SelectActionOptions = {},
  ): Move | undefined {
    const rootMoves = context.game.moves(context);
    if (rootMoves.length === 0) return undefined;
    if (rootMoves.length === 1) return rootMoves[0];

    const rootPlayer = context.mover;
    const maxDepth =
      options.maxDepth && options.maxDepth > 0
        ? options.maxDepth
        : this.defaultDepth;
    const maxIters = options.maxIterations ?? -1;
    const deadlineMs =
      options.maxSeconds && options.maxSeconds > 0
        ? Date.now() + options.maxSeconds * 1000
        : Number.POSITIVE_INFINITY;

    this.lastDepthReached = 0;
    this.lastNodesVisited = 0;

    let orderedMoves: Move[] = [...rootMoves];
    let bestMove: Move = orderedMoves[0] as Move;
    let bestScoresByMove: number[] = orderedMoves.map(
      () => Number.NEGATIVE_INFINITY,
    );

    for (let depth = 1; depth <= maxDepth; depth += 1) {
      let alpha = Number.NEGATIVE_INFINITY;
      const beta = Number.POSITIVE_INFINITY;
      let iterBest: Move = orderedMoves[0] as Move;
      let iterBestScore = Number.NEGATIVE_INFINITY;
      const iterScores: number[] = new Array<number>(orderedMoves.length).fill(
        Number.NEGATIVE_INFINITY,
      );
      let interrupted = false;

      for (let i = 0; i < orderedMoves.length; i += 1) {
        if (Date.now() >= deadlineMs) {
          interrupted = true;
          break;
        }
        if (maxIters >= 0 && this.lastNodesVisited >= maxIters) {
          interrupted = true;
          break;
        }
        const move = orderedMoves[i] as Move;
        const child = context.game.apply(context, move);
        const score = this.search(
          child,
          depth - 1,
          alpha,
          beta,
          rootPlayer,
          deadlineMs,
          maxIters,
        );
        iterScores[i] = score;
        if (score > iterBestScore) {
          iterBestScore = score;
          iterBest = move;
        }
        if (score > alpha) alpha = score;
      }

      if (!interrupted) {
        bestMove = iterBest;
        bestScoresByMove = iterScores;
        this.lastDepthReached = depth;
        // Re-order for the next iteration: descending by score so the
        // (currently) best move is searched first → tighter α.
        if (this.orderRootMoves) {
          const indices = orderedMoves.map((_, idx) => idx);
          indices.sort(
            (a, b) =>
              (bestScoresByMove[b] ?? Number.NEGATIVE_INFINITY) -
              (bestScoresByMove[a] ?? Number.NEGATIVE_INFINITY),
          );
          orderedMoves = indices.map((idx) => orderedMoves[idx] as Move);
          bestScoresByMove = indices.map(
            (idx) => bestScoresByMove[idx] ?? Number.NEGATIVE_INFINITY,
          );
        }
        // Exact win / loss — no point searching deeper.
        if (Math.abs(iterBestScore) >= WIN_SCORE - maxDepth) {
          break;
        }
      } else {
        break;
      }
    }

    return bestMove;
  }

  /**
   * Classic minimax with α-β pruning, kept in root-player perspective
   * throughout. Negamax was tempting but the engine doesn't advance the
   * mover after a game-ending move, so the side-to-move flip is unreliable
   * at terminal nodes; tracking rootPlayer explicitly is simpler.
   *
   * `maximising = (context.mover === rootPlayer)`. Returns the score from
   * `rootPlayer`'s point of view.
   */
  private search(
    context: Context,
    depth: number,
    alphaIn: number,
    betaIn: number,
    rootPlayer: number,
    deadlineMs: number,
    maxIters: number,
  ): number {
    this.lastNodesVisited += 1;

    let alpha = alphaIn;
    let beta = betaIn;
    const alphaOrig = alpha;
    const betaOrig = beta;

    if (context.over) {
      return this.terminalScore(context, rootPlayer, depth);
    }
    if (depth <= 0) {
      return this.evaluator.evaluate(context, rootPlayer);
    }

    const maximising = context.mover === rootPlayer;
    const hash = context.state.hash();
    const ttIndex = ((hash >>> 0) % this.ttSize) | 0;
    const ttEntry = this.tt[ttIndex];
    let ttBestIndex = -1;
    if (ttEntry && ttEntry.hash === hash && ttEntry.depth >= depth) {
      if (ttEntry.bound === "exact") return ttEntry.score;
      if (ttEntry.bound === "lower" && ttEntry.score > alpha)
        alpha = ttEntry.score;
      else if (ttEntry.bound === "upper" && ttEntry.score < beta)
        beta = ttEntry.score;
      if (alpha >= beta) return ttEntry.score;
      ttBestIndex = ttEntry.bestMoveIndex;
    }

    const moves = context.game.moves(context);
    if (moves.length === 0) {
      return this.terminalScore(context, rootPlayer, depth);
    }

    const order: number[] = [];
    if (ttBestIndex >= 0 && ttBestIndex < moves.length) {
      order.push(ttBestIndex);
    }
    for (let i = 0; i < moves.length; i += 1) {
      if (i !== ttBestIndex) order.push(i);
    }

    let bestScore = maximising
      ? Number.NEGATIVE_INFINITY
      : Number.POSITIVE_INFINITY;
    let bestIdx = order[0] ?? 0;

    for (const i of order) {
      if (Date.now() >= deadlineMs) break;
      if (maxIters >= 0 && this.lastNodesVisited >= maxIters) break;
      const move = moves[i] as Move;
      const child = context.game.apply(context, move);
      const score = this.search(
        child,
        depth - 1,
        alpha,
        beta,
        rootPlayer,
        deadlineMs,
        maxIters,
      );
      if (maximising) {
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
        if (score > alpha) alpha = score;
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
        if (score < beta) beta = score;
      }
      if (alpha >= beta) break;
    }

    let bound: Bound;
    if (maximising) {
      bound =
        bestScore <= alphaOrig ? "upper" : alpha >= beta ? "lower" : "exact";
    } else {
      // For min nodes: bestScore >= betaOrig ⇒ fail-high (lower bound),
      // bestScore <= alpha ⇒ fail-low for the maximiser (upper bound).
      bound =
        bestScore >= betaOrig ? "lower" : alpha >= beta ? "upper" : "exact";
    }
    this.tt[ttIndex] = {
      hash,
      depth,
      score: bestScore,
      bound,
      bestMoveIndex: bestIdx,
    };
    return bestScore;
  }

  /**
   * Score a terminal context from `rootPlayer`'s perspective. Wins shorter
   * in depth (i.e. more remaining ply) are worth more so the AI prefers
   * faster victories and slower defeats.
   */
  private terminalScore(
    context: Context,
    rootPlayer: number,
    depth: number,
  ): number {
    const winner = context.winner;
    if (winner === 0) return 0;
    const magnitude = WIN_SCORE + DEPTH_BONUS * Math.max(0, depth);
    return winner === rootPlayer ? magnitude : -magnitude;
  }
}
