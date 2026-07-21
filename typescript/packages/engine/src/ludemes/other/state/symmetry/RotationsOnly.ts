// @java Core/src/other/state/symmetry/RotationsOnly.java

import type { SymmetryType } from "./SymmetryType.js";
import type { SymmetryValidator } from "./SymmetryValidator.js";

/**
 * Only rotational symmetries and identity operators are valid.
 * Faithful 1:1 port of RotationsOnly.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class RotationsOnly implements SymmetryValidator {
  isValid(type: SymmetryType, symmetryIndex: number, _symmetryCount: number): boolean {
    switch (type) {
      case "REFLECTIONS": return false;
      case "ROTATIONS": return true;
      case "SUBSTITUTIONS": return symmetryIndex === 0; // Identity (element 0) only
    }
    return true;
  }
}
