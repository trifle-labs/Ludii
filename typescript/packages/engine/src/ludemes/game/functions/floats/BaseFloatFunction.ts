// @java Core/src/game/functions/floats/BaseFloatFunction.java

import type { Context } from "../../../../context.js";
import type { FloatFunction } from "../../../base.js";

/**
 * Common functionality for FloatFunction — override where necessary.
 *
 * Java parity: abstract class extending BaseLudeme, implementing FloatFunction.
 * In TS we have no BaseLudeme; this is an abstract class implementing the
 * FloatFunction interface from base.ts.
 *
 * @java game.functions.floats.BaseFloatFunction
 * @author cambolbro
 */
export abstract class BaseFloatFunction implements FloatFunction {
  /** @java FloatFunction.eval(Context) */
  abstract eval(ctx: Context): number;

  /** @java BaseLudeme.isStatic — true by default, override when dynamic */
  public isStatic(): boolean {
    return false;
  }

  /** @java BaseLudeme.gameFlags(Game) — 0 by default */
  public gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java BaseLudeme.preprocess(Game) — no-op by default */
  public preprocess(_game: unknown): void {
    // nothing to do
  }

  /** @java FloatFunction.concepts(Game) */
  public concepts(_game: unknown): Set<number> {
    return new Set();
  }

  /** @java FloatFunction.missingRequirement(Game) */
  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  /** @java FloatFunction.willCrash(Game) */
  public willCrash(_game: unknown): boolean {
    return false;
  }

  /** @java FloatFunction.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return "";
  }
}
