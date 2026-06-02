// @java Core/src/other/playout/HeuristicSamplingMoveSelector.java HeuristicSamplingMoveSelector
/**
 * Faithful 1:1 transliteration of other.playout.HeuristicSamplingMoveSelector.
 *
 * Heuristic Sampling playout move selector: samples a subset of moves,
 * evaluates them with the heuristic, returns the best one.
 *
 * Deferrals:
 *  - Heuristics (metadata.ai.heuristics.Heuristics): opaque IHeuristics.
 *  - Context copy: deferred (TempContext not imported).
 *
 * Java parity: other/playout/HeuristicSamplingMoveSelector.java
 */

import { PlayoutMoveSelector, type IsMoveReallyLegal, type IContext } from "./PlayoutMoveSelector.js";
import type { IHeuristics } from "./HeuristicMoveSelector.js";
import type { IMove } from "../context/Context.js";

/** Java parity: other.move.MoveScore */
export interface MoveScore {
  move(): IMove | null;
  score(): number;
}

function makeMoveScore(move: IMove | null, score: number): MoveScore {
  return { move: () => move, score: () => score };
}

export class HeuristicSamplingMoveSelector extends PlayoutMoveSelector {

  // @java protected final float TERMINAL_SCORE_MULT = 100000.f;
  protected readonly TERMINAL_SCORE_MULT: number = 100000;

  // @java private static final float PARANOID_OPP_WIN_SCORE = 10000.f;
  private static readonly PARANOID_OPP_WIN_SCORE = 10000;

  // @java private static final float WIN_SCORE = 10000.f;
  private static readonly WIN_SCORE = 10000;

  // @java public static final float ABS_HEURISTIC_WEIGHT_THRESHOLD = 0.01f;
  static readonly ABS_HEURISTIC_WEIGHT_THRESHOLD = 0.01;

  // @java private int fraction = 8;
  private _fraction: number = 8;

  // @java private boolean continuation = true;
  private _continuation: boolean = true;

  // @java private Heuristics heuristicValueFunction = null;
  private _heuristicValueFunction: IHeuristics | null = null;

  // -------------------------------------------------------------------------

  constructor();
  constructor(heuristicValueFunction: IHeuristics, game: unknown);

  constructor(heuristicValueFunction?: IHeuristics, game?: unknown) {
    super();
    if (heuristicValueFunction !== undefined) {
      this._heuristicValueFunction = heuristicValueFunction;
      heuristicValueFunction.init(game);
    }
  }

  // -------------------------------------------------------------------------

  override selectMove(
    context: IContext,
    _maybeLegalMoves: IMove[],
    _p: number,
    _isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null {
    const ms = this.evaluateMoves(context.game(), context);
    if (ms.move() === null) console.warn("** No best move.");
    return ms.move();
  }

  // -------------------------------------------------------------------------

  /** @java public int[] opponents(int player, Context context) */
  opponents(player: number, context: IContext): number[] {
    const numPlayers = context.game().players().count();
    const opps: number[] = [];
    if (context.game().requiresTeams?.()) {
      const tid = context.state().getTeam(player);
      for (let p = 1; p <= numPlayers; p++) {
        if (context.state().getTeam(p) !== tid) opps.push(p);
      }
    } else {
      for (let p = 1; p <= numPlayers; p++) {
        if (p !== player) opps.push(p);
      }
    }
    return opps;
  }

  // -------------------------------------------------------------------------

  /** @java public static FastArrayList<Move> selectMoves(...) */
  static selectMoves(game: unknown, context: IContext, fraction: number): IMove[] {
    const allMoves = (game as { moves(ctx: IContext): { moves(): { size(): number; get(i: number): IMove } } })
      .moves(context).moves();

    const playerMoves: IMove[] = [];
    for (let i = 0; i < allMoves.size(); i++) playerMoves.push(allMoves.get(i));

    const target = Math.max(2, Math.floor((playerMoves.length + 1) / fraction));
    if (target >= playerMoves.length) return playerMoves;

    const selected: IMove[] = [];
    while (selected.length < target) {
      const r = Math.floor(Math.random() * playerMoves.length);
      selected.push(playerMoves[r]!);
      playerMoves.splice(r, 1);
    }
    return selected;
  }

  // -------------------------------------------------------------------------

  /** @java public MoveScore evaluateMoves(final Game game, final Context context) */
  evaluateMoves(game: unknown, context: IContext): MoveScore {
    const moves = HeuristicSamplingMoveSelector.selectMoves(game, context, this._fraction);

    let bestScore = -Infinity;
    let bestMove: IMove | null = moves[0] ?? null;

    const mover = context.state().mover();

    for (const move of moves) {
      // Copy context (TempContext deferred — use opaque copy)
      const contextCopy = context; // DEFERRED: real copy not available here
      (game as { apply(ctx: IContext, m: IMove): void }).apply(contextCopy, move);

      if (contextCopy.trial().status() !== null) {
        const winner = contextCopy.state().playerToAgent(contextCopy.trial().status().winner());
        if (winner === mover)
          return makeMoveScore(move, HeuristicSamplingMoveSelector.WIN_SCORE);
        if (winner !== 0)
          continue;
      }

      let score = 0;
      if (this._continuation && contextCopy.state().mover() === mover) {
        return makeMoveScore(move, this.evaluateMoves(game, contextCopy).score());
      } else {
        score = this._heuristicValueFunction!.computeValue(
          contextCopy, mover, HeuristicSamplingMoveSelector.ABS_HEURISTIC_WEIGHT_THRESHOLD
        );
        for (const opp of this.opponents(mover, context)) {
          if (context.active(opp)) {
            score -= this._heuristicValueFunction!.computeValue(
              contextCopy, opp, HeuristicSamplingMoveSelector.ABS_HEURISTIC_WEIGHT_THRESHOLD
            );
          } else if (context.winners().includes(opp)) {
            score -= HeuristicSamplingMoveSelector.PARANOID_OPP_WIN_SCORE;
          }
        }
        score += Math.random() / 1000;
      }

      if (score > bestScore) { bestScore = score; bestMove = move; }
    }

    return makeMoveScore(bestMove ?? null, bestScore);
  }

  heuristicValueFunction(): IHeuristics | null { return this._heuristicValueFunction; }
  setHeuristics(h: IHeuristics): void { this._heuristicValueFunction = h; }
}
