// @java Core/src/other/state/symmetry/SymmetryValidator.java

import type { SymmetryType } from "./SymmetryType.js";

/**
 * Validates a symmetry to see if it is useful in this context.
 * Faithful 1:1 port of SymmetryValidator.java (interface).
 *
 * @author mrraow (Java), ported to TS
 */
export interface SymmetryValidator {
  /**
   * NOTE: This function should almost always return true when symmetryIndex==0
   * — this will probably be the identity operator.
   *
   * @param type The type of symmetry, e.g. reflection, rotation
   * @param symmetryIndex index of this symmetry, often an angle
   * @param symmetryCount number of symmetries
   * @returns Whether the symmetry suits this context.
   */
  isValid(type: SymmetryType, symmetryIndex: number, symmetryCount: number): boolean;
}
