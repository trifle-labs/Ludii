/**
 * Holds and evaluates the set of starting rules for a game.
 *
 * @java game/rules/start/Start.java — eval(Context)
 *
 * Java Start holds a StartRule[] and iterates them in eval(Context).
 * In the 1:1 TS path this is mirrored by Game.startRules: StartRule[]
 * which are applied in Game.start() via applyToInitialState().
 * Start is a thin data-holder that mirrors the Java class structure.
 */

import type { StartRule } from "./StartRule.js";

/**
 * @java game/rules/start/Start.java
 *
 * Container for one or more StartRule instances. eval() iterates each rule.
 * In TS the rules array is consumed by Game.start() directly; Start
 * is here to faithfully mirror the Java class.
 */
export class Start {
  /** The starting rules. @java Start.rules field. */
  public readonly rules: readonly StartRule[];

  /**
   * @param rules The starting rules.
   * @param rule  The starting rule.
   * @java game/rules/start/Start.java — constructor(@Or StartRule[] rules, @Or StartRule rule)
   */
  public constructor(rules: readonly StartRule[] | null, rule: StartRule | null) {
    const numNonNull = (rules !== null && rules !== undefined ? 1 : 0) + (rule !== null && rule !== undefined ? 1 : 0);

    if (numNonNull !== 1) {
      throw new Error("Start: exactly one Or parameter must be non-null.");
    }

    if (rules !== null && rules !== undefined) {
      this.rules = rules;
    } else if (rule !== null && rule !== undefined) {
      this.rules = [rule];
    } else {
      throw new Error("Start: exactly one Or parameter must be non-null.");
    }
  }

  /**
   * Evaluate all starting rules.
   *
   * In the 1:1 TS path this is handled by Game.start() which calls
   * rule.applyToInitialState() on each rule. This method is provided for
   * completeness to mirror Java Start.eval(Context).
   *
   * @java game/rules/start/Start.java — eval(Context): for (StartRule rule : rules) rule.eval(context)
   */
  public eval(context: import("../../../../context.js").Context): void {
    // @java Start.eval(Context): for (StartRule rule : rules) rule.eval(context)
    for (const rule of this.rules) {
      rule.eval(context);
    }
  }
}
