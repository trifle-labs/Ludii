// @java Core/src/metadata/graphics/no/No.java No
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/No.java — faithful factory-class port.
 *   Hides a graphic element based on the supplied NoBooleanType discriminant.
 */

import type { NoBooleanType } from "./NoBooleanType.js";
import { NoAnimation } from "./Boolean/NoAnimation.js";
import { NoBoard } from "./Boolean/NoBoard.js";
import { NoCurves } from "./Boolean/NoCurves.js";
import { NoDicePips } from "./Boolean/NoDicePips.js";
import { NoSunken } from "./Boolean/NoSunken.js";

export type NoGraphicsItem = NoAnimation | NoBoard | NoCurves | NoDicePips | NoSunken;

/**
 * Factory: (no <NoBooleanType> [<value>])
 *
 * HandScale and MaskedColour are defined in NoBooleanType but have no dedicated
 * sub-class in the Java source — they share the boolean-flag pattern but their
 * classes are absent. Throws if those unimplemented types are requested.
 */
export function constructNo(
  boardType: NoBooleanType,
  value?: boolean | null,
): NoGraphicsItem {
  switch (boardType) {
    case "Board":     return new NoBoard(value);
    case "Animation": return new NoAnimation(value);
    case "Sunken":    return new NoSunken(value);
    case "DicePips":  return new NoDicePips(value);
    case "Curves":    return new NoCurves(value);
    default:
      throw new Error(`No.construct: NoBooleanType "${boardType}" is not implemented.`);
  }
}
