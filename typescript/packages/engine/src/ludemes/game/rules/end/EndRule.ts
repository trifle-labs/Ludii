/**
 * Abstract base for all end rules.
 *
 * @java game/rules/end/EndRule.java
 *
 * Java: EndRule is an abstract class extending BaseLudeme that holds a Result
 * and declares abstract eval(Context) returning EndRule.
 * In the 1:1 TS path, we model this as an interface/abstract class that
 * implements EndRuleFunction (eval returns EndResult | null).
 *
 * @java game/rules/end/EndRule.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { EndRuleFunction, EndResult } from "../../../base.js";

/**
 * Abstract base for all end-rule ludemes.
 * @java game/rules/end/EndRule.java — abstract EndRule extends BaseLudeme
 */
export abstract class EndRule implements EndRuleFunction {
  /**
   * The result held by this end rule (may be null if not yet set).
   * @java game/rules/end/EndRule.java — private Result result
   */
  protected _result: import("./Result.js").Result | null;

  /**
   * @java game/rules/end/EndRule.java — constructor(Result result)
   */
  public constructor(result: import("./Result.js").Result | null = null) {
    this._result = result;
  }

  /**
   * @java game/rules/end/EndRule.java — result()
   */
  public result(): import("./Result.js").Result | null {
    return this._result;
  }

  /**
   * @java game/rules/end/EndRule.java — setResult(Result rslt)
   */
  public setResult(rslt: import("./Result.js").Result): void {
    this._result = rslt;
  }

  /**
   * Evaluate end rule. Returns EndResult if the rule fires, null otherwise.
   * @java game/rules/end/EndRule.java — abstract EndRule eval(Context context)
   */
  public abstract eval(ctx: Context): EndResult | null;
}
