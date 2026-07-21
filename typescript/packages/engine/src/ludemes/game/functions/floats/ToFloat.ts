// @java Core/src/game/functions/floats/ToFloat.java

import type { Context } from "../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../base.js";
import { BaseFloatFunction } from "./BaseFloatFunction.js";

/**
 * Converts a BooleanFunction or an IntFunction to a float.
 *
 * Java parity: @Or constructor — exactly one of boolFn / intFn must be
 * non-null. eval() returns 1 for true / 0 for false (boolean branch), or
 * casts the int result to float (int branch).
 *
 * @java game.functions.floats.ToFloat
 * @author Eric.Piette
 */
export class ToFloat extends BaseFloatFunction {
  /** The boolean function. @java ToFloat.boolFn */
  private readonly boolFn: BooleanFunction | null;

  /** The int function. @java ToFloat.intFn */
  private readonly intFn: IntFunction | null;

  /**
   * @java ToFloat(@Or BooleanFunction boolFn, @Or IntFunction intFn)
   * Exactly one parameter must be non-null.
   */
  public constructor(
    boolFn: BooleanFunction | null,
    intFn: IntFunction | null,
  ) {
    super();
    let numNonNull = 0;
    if (boolFn !== null) numNonNull++;
    if (intFn !== null) numNonNull++;
    if (numNonNull !== 1) {
      throw new Error("ToFloat(): one of boolFn or intFn must be non-null.");
    }
    this.boolFn = boolFn;
    this.intFn = intFn;
  }

  /**
   * @java ToFloat.eval(Context)
   * Boolean branch: true→1, false→0.
   * Int branch: (float) intFn.eval(context).
   */
  public eval(ctx: Context): number {
    if (this.boolFn !== null) {
      return this.boolFn.eval(ctx) ? 1 : 0;
    }
    // intFn is non-null by constructor invariant
    return this.intFn!.eval(ctx);
  }

  /** @java ToFloat.isStatic() */
  public override isStatic(): boolean {
    if (this.boolFn !== null) return (this.boolFn as { isStatic?(): boolean }).isStatic?.() ?? false;
    if (this.intFn !== null) return (this.intFn as { isStatic?(): boolean }).isStatic?.() ?? false;
    return false;
  }

  /** @java ToFloat.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    let flags = 0;
    if (this.boolFn !== null) flags |= (this.boolFn as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    if (this.intFn !== null) flags |= (this.intFn as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    return flags;
  }

  /** @java ToFloat.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const boolConcepts = (this.boolFn as { concepts?(g: unknown): Set<number> } | null)?.concepts?.(game);
    if (boolConcepts) for (const c of boolConcepts) concepts.add(c);
    const intConcepts = (this.intFn as { concepts?(g: unknown): Set<number> } | null)?.concepts?.(game);
    if (intConcepts) for (const c of intConcepts) concepts.add(c);
    return concepts;
  }

  /** @java ToFloat.preprocess(Game) */
  public override preprocess(game: unknown): void {
    if (this.boolFn !== null) (this.boolFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.intFn !== null) (this.intFn as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java ToFloat.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.boolFn !== null) missing = missing || ((this.boolFn as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    if (this.intFn !== null) missing = missing || ((this.intFn as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ToFloat.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    if (this.boolFn !== null) crash = crash || ((this.boolFn as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    if (this.intFn !== null) crash = crash || ((this.intFn as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    return crash;
  }
}
