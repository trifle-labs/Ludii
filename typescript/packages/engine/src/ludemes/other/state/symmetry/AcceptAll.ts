// @java Core/src/other/state/symmetry/AcceptAll.java

import type { SymmetryType } from "./SymmetryType.js";
import type { SymmetryValidator } from "./SymmetryValidator.js";

/**
 * Universal acceptor; all symmetries are valid.
 * Faithful 1:1 port of AcceptAll.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class AcceptAll implements SymmetryValidator {
  isValid(_type: SymmetryType, _angleIndex: number, _maxAngles: number): boolean {
    return true;
  }
}
