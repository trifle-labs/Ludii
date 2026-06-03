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
