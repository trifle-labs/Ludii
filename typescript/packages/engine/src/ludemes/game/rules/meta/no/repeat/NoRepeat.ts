/**
 * Forbids a particular type of position/situation repetition.
 *
 * @java game/rules/meta/no/repeat/NoRepeat.java
 *
 * Java: NoRepeat.eval(context) sets context.game().metaRules().setRepetitionType(type).
 * NoRepeat.apply(context, move) checks state hashes to detect repetition:
 *   - PositionalInTurn: !previousStateWithinATurn.contains(stateHash)
 *   - SituationalInTurn: !previousStateWithinATurn.contains(fullHash)
 *   - Positional: !previousState.contains(stateHash)
 *   - Situational: !previousState.contains(fullHash)
 *
 * In the 1:1 path, state hashing and previousState tracking are not implemented.
 * NoRepeat is a data class; the apply() filter is deferred.
 *
 * @java game/rules/meta/no/repeat/NoRepeat.java — eval(Context context)
 */

import { MetaRule } from "../../MetaRule.js";

/** Repetition type. @java game/types/play/RepetitionType.java */
export type RepetitionType =
  | "Positional" | "PositionalInTurn"
  | "Situational" | "SituationalInTurn"
  | string;

/**
 * @java game/rules/meta/no/repeat/NoRepeat.java — extends MetaRule
 */
export class NoRepeat extends MetaRule {
  /** The repetition type. @java NoRepeat.type */
  public readonly type: RepetitionType;

  /**
   * @java game/rules/meta/no/repeat/NoRepeat.java — constructor(@Opt RepetitionType type)
   *
   * @param type  Repetition type; defaults to Positional if null.
   */
  public constructor(type: RepetitionType | null = null) {
    super();
    // @java NoRepeat.java:43 — this.type = (type == null) ? RepetitionType.Positional : type
    this.type = type ?? "Positional";
  }

  /**
   * @java game/rules/meta/no/repeat/NoRepeat.java — eval(Context context)
   * Java: context.game().metaRules().setRepetitionType(type).
   * In the 1:1 path: no-op.
   */
  public eval(): void {
    // @java NoRepeat.eval: context.game().metaRules().setRepetitionType(type)
    // No-op in 1:1 path.
  }
}
