// @java Core/src/other/state/symmetry/ReflectionsOnly.java

import type { SymmetryType } from "./SymmetryType.js";
import type { SymmetryValidator } from "./SymmetryValidator.js";

/**
 * Only reflections are valid.
 * Faithful 1:1 port of ReflectionsOnly.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class ReflectionsOnly implements SymmetryValidator {
  isValid(type: SymmetryType, symmetryIndex: number, _symmetryCount: number): boolean {
    switch (type) {
      case "REFLECTIONS": return true;
      case "ROTATIONS": return symmetryIndex === 0;    // Identity (element 0) only
      case "SUBSTITUTIONS": return symmetryIndex === 0; // Identity (element 0) only
    }
    return true;
  }
}
