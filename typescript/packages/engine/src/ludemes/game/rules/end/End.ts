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
  private readonly rules: EndRuleFunction[];

  /**
   * @java game/rules/end/End.java — constructor(@Or EndRule endRule, @Or EndRule[] endRules)
   */
  public constructor(
    endRule: EndRuleFunction | null,
    endRules: EndRuleFunction[] | null,
  ) {
    const numNonNull = (endRule != null ? 1 : 0) + (endRules != null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    this.rules = endRule != null ? [endRule] : endRules!;
  }

  /**
   * @java game/rules/end/End.java — endRules()
   */
  public endRules(): EndRuleFunction[] {
    return this.rules;
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
