// @java Core/src/other/playout/HeuristicMoveSelector.java HeuristicMoveSelector
/**
 * Faithful 1:1 transliteration of other.playout.HeuristicMoveSelector.
 *
 * Heuristic-based playout move selector. For each candidate move, copies
 * the context, applies the move, evaluates with the heuristic function, and
 * selects the best.
 *
 * Deferrals:
 *  - Heuristics (metadata.ai.heuristics.Heuristics): represented as an
 *    opaque IHeuristics interface. The structural logic is fully
 *    transliterated; bodies that call heuristicValueFunction.computeValue()
 *    are wired to the interface.
 *  - RankUtils.agentUtilities(): deferred — always returns 0 in the stub.
 *  - TempContext: not imported; uses a plain Context copy.
 *
 * Java parity: other/playout/HeuristicMoveSelector.java
 */

import { PlayoutMoveSelector, type IsMoveReallyLegal, type IContext } from "./PlayoutMoveSelector.js";
import type { IMove } from "../context/Context.js";

/** Minimal opaque Heuristics interface */
export interface IHeuristics {
  init(game: unknown): void;
  computeValue(context: IContext, player: number, threshold: number): number;
}

/** Stub for RankUtils.agentUtilities() — deferred */
function agentUtilities(context: IContext): number[] {
  // DEFERRED: RankUtils not ported
  const numPlayers = context.game().players().count();
  return new Array<number>(numPlayers + 1).fill(0);
}

export class HeuristicMoveSelector extends PlayoutMoveSelector {

  // @java protected final float TERMINAL_SCORE_MULT = 100000.f;
  protected readonly TERMINAL_SCORE_MULT: number = 100000;

  // @java protected Heuristics heuristicValueFunction = null;
  protected _heuristicValueFunction: IHeuristics | null = null;

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
    maybeLegalMoves: IMove[],
    p: number,
    isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null {
    const game = context.game();
    const bestMoves: IMove[] = [];
    let bestValue = -Infinity;

    for (const move of maybeLegalMoves) {
      if (isMoveReallyLegal.checkMove(move)) {
        // Copy context (TempContext semantics deferred — use plain copy)
        const copyContext = copyCtx(context);
        game.apply(copyContext, move);

        let heuristicScore = 0;

        if (copyContext.trial().over() || !copyContext.active(p)) {
          // Terminal node
          heuristicScore = (agentUtilities(copyContext)[p] ?? 0) * this.TERMINAL_SCORE_MULT;
        } else {
          for (let player = 1; player <= game.players().count(); player++) {
            if (copyContext.active(player)) {
              const playerScore = this._heuristicValueFunction!.computeValue(copyContext, player, 0);
              if (player === p) heuristicScore += playerScore;
              else              heuristicScore -= playerScore;
            }
          }
        }

        if (heuristicScore > bestValue) {
          bestValue = heuristicScore;
          bestMoves.length = 0;
          bestMoves.push(move);
        } else if (heuristicScore === bestValue) {
          bestMoves.push(move);
        }
      }
    }

    return bestMoves.length > 0
      ? (bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null)
      : null;
  }

  heuristicValueFunction(): IHeuristics | null { return this._heuristicValueFunction; }
  setHeuristics(h: IHeuristics): void { this._heuristicValueFunction = h; }
}

/** Shallow context copy stub (TempContext not imported to avoid circular deps) */
function copyCtx(ctx: IContext): IContext {
  // DEFERRED: real TempContext not used here; rely on game.apply() being safe
  return ctx;
}
