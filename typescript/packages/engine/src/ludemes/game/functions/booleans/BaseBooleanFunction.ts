// @java Core/src/game/functions/booleans/BaseBooleanFunction.java

/**
 * Common functionality for boolean functions: default implementations for
 * autoFails, autoSucceeds, regionConstraint, locsConstraint, staticRegion,
 * satisfyingSites, and stateConcepts.
 *
 * Coverage / documentation module. Concrete classes extend this in Java;
 * in the 1:1 TS port they implement the lightweight `BooleanFunction`
 * interface from base.ts and carry only the fields/methods they need.
 *
 * @java game.functions.booleans.BaseBooleanFunction
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, RegionFunction, IntFunction } from "../../../base.js";
import type { RegionTypeStatic } from "./BooleanFunction.js";

/**
 * Abstract base providing default no-op / stub implementations of the
 * full `BaseBooleanFunction` surface from Java.
 *
 * @java game.functions.booleans.BaseBooleanFunction
 */
export abstract class BaseBooleanFunction implements BooleanFunction {
  // ---- puzzle constraint fields (Java: BaseBooleanFunction) ----------------
  /** @java BaseBooleanFunction.regionConstraint */
  public regionConstraintField: RegionFunction | null = null;
  /** @java BaseBooleanFunction.locsConstraint */
  public locsConstraintField: IntFunction[] | null = null;
  /** @java BaseBooleanFunction.areaConstraint */
  public areaConstraint: RegionTypeStatic | null = null;

  // ---- abstract ----------------------------------------------------------

  /** Evaluate the boolean function in the given context. */
  public abstract eval(context: Context): boolean;

  // ---- concrete defaults (BaseBooleanFunction.java) -----------------------

  /** @java BaseBooleanFunction.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java BaseBooleanFunction.autoFails() */
  public autoFails(): boolean {
    return false;
  }

  /** @java BaseBooleanFunction.autoSucceeds() */
  public autoSucceeds(): boolean {
    return false;
  }

  /** @java BaseBooleanFunction.regionConstraint() */
  public regionConstraint(): RegionFunction | null {
    return this.regionConstraintField;
  }

  /** @java BaseBooleanFunction.locsConstraint() */
  public locsConstraint(): IntFunction[] | null {
    return this.locsConstraintField;
  }

  /** @java BaseBooleanFunction.staticRegion() */
  public staticRegion(): RegionTypeStatic | null {
    return this.areaConstraint;
  }

  /** @java BaseBooleanFunction.satisfyingSites(Context) — returns empty list */
  public satisfyingSites(_context: Context): { site: number }[] {
    return [];
  }

  /**
   * @java BaseBooleanFunction.stateConcepts(Context)
   * Returns the concepts iff eval() returns true; otherwise empty.
   */
  public stateConcepts(context: Context): Set<number> {
    if (this.eval(context)) {
      return this.concepts(context.game);
    }
    return new Set<number>();
  }

  // ---- optional overrides (subclasses supply these) ----------------------

  public gameFlags(_game: unknown): number {
    return 0;
  }

  public concepts(_game: unknown): Set<number> {
    return new Set<number>();
  }

  public readsEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  public writesEvalContextRecursive(): Set<number> {
    return new Set<number>();
  }

  public missingRequirement(_game: unknown): boolean {
    return false;
  }

  public willCrash(_game: unknown): boolean {
    return false;
  }

  public preprocess(_game: unknown): void {
    // default: nothing to do
  }

  public toEnglish(_game: unknown): string {
    return this.toString();
  }
}
