// @java Core/src/game/functions/booleans/BooleanFunction.java

/**
 * Returns a boolean. Mirror of the Java interface shape.
 *
 * NOTE: The 1:1 runtime interface (used by concrete ludeme classes) lives in
 * src/ludemes/base.ts as `BooleanFunction`. This file is a *coverage* module
 * that re-declares the full Java interface surface for documentation / static
 * analysis purposes only. It does NOT re-export under the same name to avoid
 * clashing with base.ts.
 *
 * @java game.functions.booleans.BooleanFunction
 */

import type { Context } from "../../../../context.js";
import type { RegionFunction, IntFunction } from "../../../base.js";

/** Java-shape parity of RegionTypeStatic. */
export type RegionTypeStatic = "Regions" | "AllDirections" | string;

/**
 * Full Java interface surface for `BooleanFunction`.
 * @java game.functions.booleans.BooleanFunction
 */
export interface BooleanFunctionFull {
  eval(context: Context): boolean;
  autoFails(): boolean;
  autoSucceeds(): boolean;
  regionConstraint(): RegionFunction | null;
  locsConstraint(): IntFunction[] | null;
  staticRegion(): RegionTypeStatic | null;
  satisfyingSites(context: Context): { site: number }[];
  gameFlags(game: unknown): number;
  concepts(game: unknown): Set<number>;
  readsEvalContextRecursive(): Set<number>;
  writesEvalContextRecursive(): Set<number>;
  missingRequirement(game: unknown): boolean;
  willCrash(game: unknown): boolean;
  stateConcepts(context: Context): Set<number>;
  toEnglish(game: unknown): string;
}
