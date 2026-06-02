/**
 * Applies a gravity effect after each move.
 *
 * @java game/rules/meta/Gravity.java
 *
 * Java: Gravity.eval(context) sets context.game().metaRules().setGravityType(type).
 * Gravity.apply() simulates PyramidalDrop by moving pieces downward step-by-step
 * using the board's Vertex-topology with AbsoluteDirection.Downward steps.
 * This requires a 3D vertex topology API absent from the 1:1 path.
 *
 * In the 1:1 path, Gravity is a data class storing the type.
 * The apply() logic is deferred (requires 3D topology + vertex-type board).
 *
 * @java game/rules/meta/Gravity.java — eval(Context context)
 */

import { MetaRule } from "./MetaRule.js";

/** Gravity types. @java game/types/play/GravityType.java */
export type GravityType = "PyramidalDrop" | string;

/**
 * @java game/rules/meta/Gravity.java — extends MetaRule
 */
export class Gravity extends MetaRule {
  /** The gravity type. @java Gravity.type */
  public readonly type: GravityType;

  /**
   * @java game/rules/meta/Gravity.java — constructor(@Opt GravityType type)
   *
   * @param type  Gravity type; defaults to PyramidalDrop if null.
   */
  public constructor(type: GravityType | null = null) {
    super();
    // @java Gravity.java:50 — this.type = (type == null) ? GravityType.PyramidalDrop : type
    this.type = type ?? "PyramidalDrop";
  }

  /**
   * @java game/rules/meta/Gravity.java — eval(Context context)
   * Java: context.game().metaRules().setGravityType(type).
   * In the 1:1 path: no MetaRules object; no-op.
   */
  public eval(): void {
    // @java Gravity.eval: context.game().metaRules().setGravityType(type)
    // No-op in 1:1 path.
  }
}
