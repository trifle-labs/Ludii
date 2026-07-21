// @java Core/src/game/functions/intArray/BaseIntArrayFunction.java

/**
 * Common functionality for IntArrayFunction — override where necessary.
 *
 * @java game/functions/intArray/BaseIntArrayFunction.java
 *
 * Java parity: abstract class BaseIntArrayFunction extends BaseLudeme implements
 * IntArrayFunction. In TS there is no BaseLudeme layer; this becomes an abstract
 * class that implements the IntArrayFunction interface from base.ts.
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch, IntArrayFunction } from "../../../base.js";

/**
 * Abstract base for all IntArrayFunction implementations.
 * Concrete subclasses must implement eval().
 * @java game.functions.intArray.BaseIntArrayFunction
 */
export abstract class BaseIntArrayFunction implements IntArrayFunction {
  /** @java BaseIntArrayFunction — eval() abstract */
  public abstract eval(ctx: Context & EvalScratch): number[];
}
