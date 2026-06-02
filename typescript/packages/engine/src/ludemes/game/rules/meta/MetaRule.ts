/**
 * Abstract base for all meta-rule ludemes.
 *
 * @java game/rules/meta/MetaRule.java
 *
 * Java: MetaRule is an abstract class extending BaseLudeme implementing Rule.
 * Its eval(context) sets flags on context.game().metaRules() and returns void.
 * The actual move-filtering logic lives in static apply() methods on each
 * concrete subclass.
 *
 * In the 1:1 TS path there is no MetaRules object; meta rules are represented
 * as data-holder objects. The apply() filtering is handled separately where
 * supported.
 *
 * @java game/rules/meta/MetaRule.java — abstract MetaRule extends BaseLudeme implements Rule
 */

/**
 * Abstract base for meta-rule ludemes.
 * @java game/rules/meta/MetaRule.java
 */
export abstract class MetaRule {
  /**
   * Evaluate this meta rule.
   * In Java: sets flags on context.game().metaRules(). In the 1:1 path this
   * is a no-op for most meta rules (flags are checked at move-filter time).
   * @java game/rules/meta/MetaRule.java — abstract void eval(Context context)
   */
  public abstract eval(): void;
}
