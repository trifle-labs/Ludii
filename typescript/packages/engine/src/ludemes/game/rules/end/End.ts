/**
 * @java game/rules/end/End.java End
 *
 * Container for a list of end rules (If conditions).
 * eval() runs each rule in order and returns the first non-null result.
 *
 * @java game/rules/end/End.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { EndRuleFunction, EndResult } from "../../../base.js";

export class End {
  private readonly rules: readonly EndRuleFunction[];

  /**
   * @java game/rules/end/End.java — constructor
   */
  public constructor(rules: readonly EndRuleFunction[]) {
    this.rules = rules;
  }

  /**
   * @java game/rules/end/End.java — eval(Context context)
   * Evaluates each rule; returns the first firing result, or null.
   */
  public eval(ctx: Context): EndResult | null {
    for (const rule of this.rules) {
      const result = rule.eval(ctx);
      if (result !== null) return result;
    }
    return null;
  }
}
