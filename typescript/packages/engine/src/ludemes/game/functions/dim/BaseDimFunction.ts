// @java Core/src/game/functions/dim/BaseDimFunction.java

import type { DimFunction } from "./DimFunction.js";

/**
 * Common functionality for DimFunction — override where necessary.
 *
 * Java parity: @Alias("dim") abstract class extending BaseLudeme,
 * implementing DimFunction. isStatic() always returns true; gameFlags()
 * returns 0; preprocess() is a no-op.
 *
 * @java game.functions.dim.BaseDimFunction
 * @author Eric.Piette and cambolbro
 */
export abstract class BaseDimFunction implements DimFunction {
  /** @java DimFunction.eval() */
  abstract eval(): number;

  /** @java BaseLudeme.isStatic() — always true for dim constants */
  public isStatic(): boolean {
    return true;
  }

  /** @java BaseLudeme.gameFlags(Game) — 0 */
  public gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java BaseLudeme.preprocess(Game) — nothing to do */
  public preprocess(_game: unknown): void {
    // nothing to do
  }

  /** @java DimFunction.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return String(this.eval());
  }
}
