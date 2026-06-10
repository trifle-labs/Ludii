// @java Core/src/game/functions/booleans/can/CanMove.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, MovesFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1, compileMoves1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import type { Game1to1 } from "../../../../Game1to1.js";

/** Module-level recursion guard — mirrors Java's ThreadLocal<Boolean> autoFail. */
let _canMoveActive = false;

/**
 * (can Move [<specificMoves>])
 * `(can Move)` — can the mover make ANY move. `(can Move <moves>)` — can the
 * mover make at least one of the GIVEN moves (e.g. `(can Move (EncloseCapture …))`
 * for the Go no-capture/no-suicide rule). The argument was previously ignored,
 * which made `(can Move <X>)` always true (= "can move at all").
 * @java game/functions/booleans/can/CanMove.java — moves.eval(context).moves().isEmpty()
 */
export class CanMove1to1 implements BooleanFunction {
  private readonly specificMoves: MovesFunction | null;
  public constructor(specificMoves: MovesFunction | null = null) {
    this.specificMoves = specificMoves;
  }

  public eval(ctx: Context): boolean {
    if (_canMoveActive) return false; // recursion guard
    _canMoveActive = true;
    try {
      if (this.specificMoves !== null) {
        // Can the mover make at least one of the GIVEN moves?
        return this.specificMoves.eval(ctx).filter(m => !m.isPass?.()).length > 0;
      }
      const g = ctx.game as unknown as Game1to1;
      return g.moves(ctx).length > 0;
    } catch {
      return false;
    } finally {
      _canMoveActive = false;
    }
  }
}

