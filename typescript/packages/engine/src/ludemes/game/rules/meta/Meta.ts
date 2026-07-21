/**
 * Container for a collection of meta-rules.
 *
 * @java game/rules/meta/Meta.java
 *
 * Java: Meta extends BaseLudeme and holds an array of MetaRule instances.
 * Its eval(context) is not declared (it is a grammar container, not an
 * evaluatable rule itself). Rules are applied via each MetaRule.eval() and
 * the static apply() methods on the concrete subclasses.
 *
 * @java game/rules/meta/Meta.java — Meta(@Or MetaRule[] rules, @Or MetaRule rule)
 */

import type { MetaRule } from "./MetaRule.js";

/**
 * @java game/rules/meta/Meta.java
 */
export class Meta {
  /**
   * The contained meta rules.
   * @java game/rules/meta/Meta.java — MetaRule[] rules
   */
  public readonly rules: readonly MetaRule[];

  /**
   * @java game/rules/meta/Meta.java — constructor(@Or MetaRule[] rules, @Or MetaRule rule)
   *
   * @param rules A collection of metarules.
   * @param rule  A single metarule.
   */
  public constructor(
    rules: readonly MetaRule[] | null,
    rule: MetaRule | null,
  ) {
    let numNonNull = 0;
    if (rules !== null) numNonNull++;
    if (rule !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    if (rules !== null) {
      this.rules = rules;
    } else {
      this.rules = [rule!];
    }
  }
}
