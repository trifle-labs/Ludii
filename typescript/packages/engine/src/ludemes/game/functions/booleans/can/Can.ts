// @java Core/src/game/functions/booleans/can/Can.java

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";
import { CanMove } from "./CanMove.js";
import { CanType } from "./CanType.js";
import { Moves } from "../../../rules/play/moves/Moves.js";

/**
 * Returns whether a given property can be achieved in the current game state.
 *
 * @java game/functions/booleans/can/Can.java
 * @author Eric.Piette
 */
export class Can extends BaseBooleanFunction {

  /**
   * Static factory: dispatches to the right sub-class based on CanType.
   *
   * @param canType Type of query.
   * @param moves   List of moves.
   * @java Can.construct(CanType, Moves)
   * @example (can Move (forEach Piece))
   */
  public static construct(canType: CanType, moves: Moves): BaseBooleanFunction {
    switch (canType) {
      case CanType.Move:
        return new CanMove(moves);
      default:
        break;
    }
    // Java: throw new IllegalArgumentException("Can(): A CanType is not implemented.");
    throw new Error("Can.construct(): A CanType is not implemented.");
  }

  /** @java Can() — private, should never be instantiated directly */
  private constructor() {
    super();
  }

  /** @java Can.isStatic() — should never be called directly */
  public override isStatic(): boolean {
    return false;
  }

  /** @java Can.gameFlags(Game) — should never be called directly */
  public override gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java Can.preprocess(Game) — nothing to do */
  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }

  /**
   * @java Can.eval(Context) — should never be called directly; only subclasses
   */
  public override eval(_context: Context): boolean {
    throw new Error("Can.eval(): Should never be called directly.");
  }
}
