// @java Core/src/game/functions/intArray/IntArrayFunction.java

/**
 * Returns an int array function.
 *
 * @java game/functions/intArray/IntArrayFunction.java
 *
 * Java parity: IntArrayFunction is an interface extending GameType. In the TS
 * 1:1 port this becomes a TypeScript interface. The canonical IntArrayFunction
 * interface is already exported from base.ts; this module re-declares it in
 * its own file for Java-source traceability WITHOUT re-exporting (to avoid
 * duplicate-identifier errors with base.ts).
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";

/**
 * Int-array-valued ludeme interface.
 * @java game.functions.intArray.IntArrayFunction
 * NOTE: the canonical engine-wide export lives in src/ludemes/base.ts.
 * This declaration mirrors the Java source without clashing with that export.
 */
export interface IntArrayFunction {
  /** @java IntArrayFunction.eval(Context) */
  eval(ctx: Context & EvalScratch): number[];
}
