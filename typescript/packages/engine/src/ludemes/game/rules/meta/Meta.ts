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
 * @java game/rules/meta/Meta.java — Meta(MetaRule[] rules)
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
   * @java game/rules/meta/Meta.java — constructor(MetaRule[] rules, MetaRule rule)
   *
   * @param rules  One or more meta rules.
   */
  public constructor(rules: readonly MetaRule[]) {
    this.rules = rules;
  }
}
