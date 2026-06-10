// @java Core/src/game/rules/play/moves/nonDecision/effect/Then.java
/**
 * Defines the subsequents of a move, to be applied after the move.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Then.java
 *
 * @remarks This is used to define subsequent moves by the same player in a
 *          turn after a move is made.
 */

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";

export class Then {
  /** @java Then.moves */
  private readonly _moves: MovesFunction;

  /** @java Then.applyAfterAllMoves — whether to apply after all simultaneous moves */
  private readonly applyAfterAllMoves: boolean;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Then.java — constructor
   * @param moves              The moves to apply afterwards.
   * @param applyAfterAllMoves For simultaneous game, apply subsequents after all moves [false].
   */
  public constructor(
    moves: MovesFunction,
    applyAfterAllMoves = false,
  ) {
    this._moves = moves;
    this.applyAfterAllMoves = applyAfterAllMoves;
  }

  /**
   * @java Then.moves()
   * @return Moves in the consequence.
   */
  public moves(): MovesFunction {
    return this._moves;
  }

  /**
   * @java Then.applyAfterAllMoves()
   */
  public getApplyAfterAllMoves(): boolean {
    return this.applyAfterAllMoves;
  }

  /**
   * Evaluate the subsequent moves.
   * @java Then.moves().eval(context)
   */
  public eval(ctx: Context): Move[] {
    return this._moves.eval(ctx);
  }

  public toString(): string {
    return `[Then: ${this._moves}]`;
  }
}

/**
 * Attach a `(then ...)` consequence to a move for APPLY-TIME evaluation.
 *
 * Java semantics: every Moves wrapper with a then adds it to its generated
 * moves' then() list (`m.then().add(then().moves())`), and Move.apply
 * evaluates the list AFTER all the move's actions have applied — including
 * actions appended later by OUTER wrappers (ForEachDie appends ActionUseDie
 * to moves whose inner ForEachSite then is already attached; the consequence
 * `(not (all DiceUsed))` must see the die consumed). An earlier version of
 * this helper baked the consequence at generation time by simulating the
 * post-move state, which evaluated the then BEFORE such outer actions
 * existed (Backgammon bear-off granted a moveAgain after the last die).
 * Game.apply performs the deferred evaluation (see Game.applyDeferredThens).
 *
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 * @java other/move/Move.java — apply() evaluates then() after the actions
 */
export function applyPostStateThen(
  thenLike: unknown,
  _ctx: Context,
  m: Move,
): Move {
  if (thenLike == null) return m;
  const t = thenLike as { eval?(ctx: Context): Move[]; moves?(): { eval(ctx: Context): Move[] } };
  const gen = typeof t.eval === "function"
    ? (t as { eval(c: Context): Move[] })
    : (typeof t.moves === "function" ? t.moves() : null);
  if (gen == null || typeof (gen as { eval?: unknown }).eval !== "function") return m;
  return m.withDeferredThen(gen as { eval(ctx: unknown): Move[] });
}
