/**
 * Factory/dispatch class for no-meta-rules.
 *
 * @java game/rules/meta/no/No.java
 *
 * Java: No is a factory (no public constructor) with two static construct()
 * overloads: one for NoRepeatType (returns a NoRepeat instance) and one for
 * NoSimpleType (returns a NoSuicide instance). The No class itself is never
 * directly instantiated.
 *
 * In the 1:1 path, we expose only the two static factory methods.
 *
 * @java game/rules/meta/no/No.java — static construct(…)
 */

import type { MetaRule } from "../MetaRule.js";
import { NoRepeat } from "./repeat/NoRepeat.js";
import { NoSuicide } from "./simple/NoSuicide.js";
import type { NoRepeatType } from "./NoRepeatType.js";
import type { NoSimpleType } from "./NoSimpleType.js";

/** Repetition type for NoRepeat. @java game/types/play/RepetitionType.java */
export type RepetitionType =
  | "Positional" | "PositionalInTurn"
  | "Situational" | "SituationalInTurn"
  | string;

/**
 * @java game/rules/meta/no/No.java — factory for no-meta-rules
 */
export class No {
  private constructor() {
    // @java No.java — private No() { } (grammar picks up construct() not constructor)
  }

  /**
   * Create a NoRepeat meta rule.
   * @java game/rules/meta/no/No.java — static MetaRule construct(NoRepeatType, RepetitionType)
   *
   * @param _type            Must be "Repeat".
   * @param repetitionType   Type of repetition to forbid (default: Positional).
   */
  public static constructRepeat(
    _type: NoRepeatType,
    repetitionType: RepetitionType | null = null,
  ): MetaRule {
    // @java No.construct:38 — case Repeat: return new NoRepeat(repetitionType)
    return new NoRepeat(repetitionType);
  }

  /**
   * Create a NoSuicide meta rule.
   * @java game/rules/meta/no/No.java — static MetaRule construct(NoSimpleType)
   *
   * @param _type  Must be "Suicide".
   */
  public static constructSimple(_type: NoSimpleType): MetaRule {
    // @java No.construct:59 — case Suicide: return new NoSuicide()
    return new NoSuicide();
  }
}
