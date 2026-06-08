/**
 * Holds and evaluates the set of starting rules for a game.
 *
 * @java game/rules/start/Start.java — eval(Context)
 *
 * Java Start holds a StartRule[] and iterates them in eval(Context).
 * In the 1:1 TS path this is mirrored by Game1to1.startRules: StartRule[]
 * which are applied in Game1to1.start() via applyToInitialState().
 * Start1to1 is a thin data-holder that mirrors the Java class structure.
 */

import type { StartRule } from "./StartRule.js";

/**
 * @java game/rules/start/Start.java
 *
 * Container for one or more StartRule instances. eval() iterates each rule.
 * In TS the rules array is consumed by Game1to1.start() directly; Start1to1
 * is here to faithfully mirror the Java class.
 */
export class Start1to1 {
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
      throw new Error("Start1to1: exactly one Or parameter must be non-null.");
    }

    if (rules !== null && rules !== undefined) {
      this.rules = rules;
    } else if (rule !== null && rule !== undefined) {
      this.rules = [rule];
    } else {
      throw new Error("Start1to1: exactly one Or parameter must be non-null.");
    }
  }

  /**
   * Evaluate all starting rules.
   *
   * In the 1:1 TS path this is handled by Game1to1.start() which calls
   * rule.applyToInitialState() on each rule. This method is provided for
   * completeness to mirror Java Start.eval(Context).
   *
   * @java game/rules/start/Start.java — eval(Context): for (StartRule rule : rules) rule.eval(context)
   */
  public eval(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: import("../../equipment/Equipment1to1.js").Equipment1to1,
    numPlayers: number,
  ): void {
    for (const rule of this.rules) {
      rule.applyToInitialState(cells, whats, countAt, equipment, numPlayers);
    }
  }
}
