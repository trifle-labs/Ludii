/**
 * Filters moves that would stack a piece on a fallen piece.
 *
 * @java game/rules/meta/NoStackOn.java
 *
 * Java: NoStackOn.eval(context) sets context.game().metaRules().setNoStackOnType(type).
 * NoStackOn.apply() with NoStackOnType.Fallen removes any move that places a piece
 * onto a site occupied by a "fallen" piece (Downward adjacency check in vertex topology).
 * This requires the 3D vertex-topology and Downward direction API absent from the 1:1 path.
 *
 * In the 1:1 path, NoStackOn is a data class storing the no-stack type.
 * The apply() filter logic is deferred.
 *
 * @java game/rules/meta/NoStackOn.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/** No-stack-on type. @java game/types/play/NoStackOnType.java */
export type NoStackOnType = "Fallen" | string;

/**
 * @java game/rules/meta/NoStackOn.java — extends MetaRule
 */
export class NoStackOn extends MetaRule {
  /** The no-stack-on type. @java NoStackOn.type */
  public readonly type: NoStackOnType;

  /**
   * @java game/rules/meta/NoStackOn.java — constructor(NoStackOnType type)
   */
  public constructor(type: NoStackOnType) {
    super();
    this.type = type;
  }

  /**
   * @java game/rules/meta/NoStackOn.java — eval(Context context)
   * Java: context.game().metaRules().setNoStackOnType(type).
   * In the 1:1 path: no-op.
   */
  public eval(): void {
    // @java NoStackOn.eval: context.game().metaRules().setNoStackOnType(type)
    // No-op in 1:1 path.
  }
}
