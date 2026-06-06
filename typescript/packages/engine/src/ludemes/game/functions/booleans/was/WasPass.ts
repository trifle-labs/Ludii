// @java Core/src/game/functions/booleans/was/WasPass.java

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";

/**
 * Checks if the last move was a pass move.
 *
 * @java game/functions/booleans/was/WasPass.java
 * @author Eric.Piette
 */
export class WasPass extends BaseBooleanFunction {
  /**
   * @java WasPass()
   */
  public constructor() {
    super();
    // Nothing to do.
  }

  /**
   * @java WasPass.eval(Context)
   */
  public override eval(context: Context): boolean {
    return context.trial.lastMove()?.isPass() ?? false;
  }

  /** @java WasPass.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java WasPass.toString() */
  public override toString(): string {
    return "(WasPass)";
  }

  /** @java WasPass.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the last move was a pass move";
  }
}
