// @java Core/src/other/state/symmetry/AcceptNone.java

import type { SymmetryType } from "./SymmetryType.js";
import type { SymmetryValidator } from "./SymmetryValidator.js";

/**
 * Universal rejector; no symmetries are valid except the identity.
 * Faithful 1:1 port of AcceptNone.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class AcceptNone implements SymmetryValidator {
  isValid(type: SymmetryType, symmetryIndex: number, _symmetryCount: number): boolean {
    switch (type) {
      case "REFLECTIONS": return false;
      case "ROTATIONS": return symmetryIndex === 0;
      case "SUBSTITUTIONS": return symmetryIndex === 0;
    }
    return false;
  }
}
