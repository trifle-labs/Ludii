/**
 * Filters moves where a piece cannot be removed because of pieces above it.
 *
 * @java game/rules/meta/Pin.java
 *
 * Java: Pin.eval(context) sets context.game().metaRules().setPinType(type).
 * Pin.apply() with PinType.SupportMultiple filters any move that would remove
 * a vertex-site piece that supports more than one piece above it (Upward steps).
 * This requires the 3D vertex-topology AbsoluteDirection.Upward API absent
 * from the 1:1 path.
 *
 * In the 1:1 path, Pin is a data class storing the pin type.
 * The apply() filter logic is deferred.
 *
 * @java game/rules/meta/Pin.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/** Pin type. @java game/types/play/PinType.java */
export type PinType = "SupportMultiple" | string;

/**
 * @java game/rules/meta/Pin.java — extends MetaRule
 */
export class Pin extends MetaRule {
  /** The pin type. @java Pin.type */
  public readonly type: PinType;

  /**
   * @java game/rules/meta/Pin.java — constructor(PinType type)
   */
  public constructor(type: PinType) {
    super();
    this.type = type;
  }

  /**
   * @java game/rules/meta/Pin.java — eval(Context context)
   * Java: context.game().metaRules().setPinType(type).
   * In the 1:1 path: no-op.
   */
  public eval(): void {
    // @java Pin.eval: context.game().metaRules().setPinType(type)
    // No-op in 1:1 path.
  }
}
