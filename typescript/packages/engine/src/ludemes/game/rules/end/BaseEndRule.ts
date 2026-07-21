/**
 * Dual-role object: links end rules in the grammar and holds a Result.
 *
 * @java game/rules/end/BaseEndRule.java
 *
 * Java: BaseEndRule extends EndRule. Its eval() always returns null —
 * it is used as a carrier/wrapper object, not to evaluate end conditions.
 * ForEach.eval() returns a new BaseEndRule(null) when no condition fires.
 *
 * @java game/rules/end/BaseEndRule.java — eval(Context context) returns null
 */

import type { Context } from "../../../../context.js";
import type { EndResult } from "../../../base.js";
import { EndRule } from "./EndRule.js";
import type { Result } from "./Result.js";

/**
 * @java game/rules/end/BaseEndRule.java
 */
export class BaseEndRule extends EndRule {
  /**
   * @java game/rules/end/BaseEndRule.java — constructor(Result result)
   */
  public constructor(result: Result | null = null) {
    super(result);
  }

  /**
   * @java game/rules/end/BaseEndRule.java — eval(Context context) returns null
   * Base implementation: always returns null (no-op).
   */
  public eval(_ctx: Context): EndResult | null {
    return null;
  }
}
