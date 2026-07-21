// @java Core/src/other/state/symmetry/SubstitutionsOnly.java

import type { SymmetryType } from "./SymmetryType.js";
import type { SymmetryValidator } from "./SymmetryValidator.js";

/**
 * Only player substitutions are valid.
 * Faithful 1:1 port of SubstitutionsOnly.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class SubstitutionsOnly implements SymmetryValidator {
  isValid(type: SymmetryType, symmetryIndex: number, _symmetryCount: number): boolean {
    switch (type) {
      case "REFLECTIONS": return false;
      case "ROTATIONS": return symmetryIndex === 0; // Identity (element 0) only
      case "SUBSTITUTIONS": return true;
    }
    return true;
  }
}
