/**
 * Applies an end result when all players pass consecutively.
 *
 * @java game/rules/meta/PassEnd.java
 *
 * Java: PassEnd.eval(context) does nothing (evaluation is a no-op here).
 * The PassEnd type flag is inspected by game-level logic via gameFlags()
 * which returns GameType.NotAllPass when type == PassEndType.NoEnd.
 *
 * In the 1:1 path, PassEnd is a data class storing the type.
 *
 * @java game/rules/meta/PassEnd.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/** PassEnd type. @java game/types/play/PassEndType.java */
export type PassEndType = "NoEnd" | string;

/**
 * @java game/rules/meta/PassEnd.java — extends MetaRule
 */
export class PassEnd extends MetaRule {
  /** The passEnd type. @java PassEnd.type */
  public readonly type: PassEndType;

  /**
   * @java game/rules/meta/PassEnd.java — constructor(PassEndType type)
   */
  public constructor(type: PassEndType) {
    super();
    this.type = type;
  }

  /**
   * @java game/rules/meta/PassEnd.java — eval(Context context) { /* Nothing to do. *\/ }
   * Java: does nothing.
   */
  public eval(): void {
    // @java PassEnd.eval: Nothing to do.
  }
}
