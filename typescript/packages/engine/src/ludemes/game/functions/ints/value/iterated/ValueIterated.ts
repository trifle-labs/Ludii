// @java Core/src/game/functions/ints/value/iterated/ValueIterated.java

/**
 * Returns the "value" value stored in the context.
 *
 * @java game/functions/ints/value/iterated/ValueIterated.java
 * @author Eric.Piette
 *
 * @remarks This ludeme is used by (forEach Value ...) to iterate over a
 *          set of values.
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";

/**
 * Returns the iterated "value" from the context.
 * Java: context.value()
 *
 * @java game/functions/ints/value/iterated/ValueIterated.java
 */
export class ValueIterated extends BaseIntFunction {

  /**
   * @java ValueIterated()
   */
  public constructor() {
    super();
    // Nothing to do.
  }

  //-------------------------------------------------------------------------

  /**
   * @java ValueIterated.eval(Context)
   *
   * Returns the value scratch field from the context.
   * Java: return context.value();
   */
  public override eval(context: Context): number {
    // Java: return context.value();
    // In the lean Context, this is _evalValue.
    return context._evalValue;
  }

  //-------------------------------------------------------------------------

  /** @java ValueIterated.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ValueIterated.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set<number>();
  }

  /** @java ValueIterated.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  /** @java ValueIterated.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    // Java: readEvalContext.set(EvalContextData.Value.id(), true);
    // We return an empty set as a best-effort port; the EvalContextData
    // bit-id is not available in the lean TS path.
    return new Set<number>();
  }

  /** @java ValueIterated.toString() */
  public override toString(): string {
    return "value";
  }

  /** @java ValueIterated.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "current value";
  }
}
