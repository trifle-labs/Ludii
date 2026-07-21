// @java Core/src/other/state/symmetry/SymmetryType.java

/**
 * All supported types of symmetry.
 * Faithful 1:1 port of SymmetryType.java (enum).
 *
 * @author mrraow (Java), ported to TS
 */
export type SymmetryType = "ROTATIONS" | "REFLECTIONS" | "SUBSTITUTIONS";

export const SymmetryTypeValues: SymmetryType[] = ["ROTATIONS", "REFLECTIONS", "SUBSTITUTIONS"];

/** Java: EnumSet.allOf(SymmetryType.class) */
export const SYMMETRY_ALL: ReadonlySet<SymmetryType> = new Set(SymmetryTypeValues);

/** Java: EnumSet.noneOf(SymmetryType.class) */
export const SYMMETRY_NONE: ReadonlySet<SymmetryType> = new Set();
