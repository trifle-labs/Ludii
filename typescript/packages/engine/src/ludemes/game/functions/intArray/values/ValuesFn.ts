// @java Core/src/game/functions/intArray/values/Values.java

/**
 * Static factory for the (values …) int-array variants.
 *
 * @java game/functions/intArray/values/Values.java
 * @author Eric.Piette
 */

import { ValuesRemembered } from "./ValuesRemembered.js";

export class Values {
  private constructor() { /* static-factory-only, like Java */ }

  /** @java Values.construct(ValuesStringType valuesType, @Opt String name) */
  public static construct(valuesType: string, name: string | null = null): ValuesRemembered {
    switch (valuesType) {
      case "Remembered":
        return new ValuesRemembered(name);
      default:
        throw new Error(`Values(): A ValuesStringType is not implemented: ${valuesType}`);
    }
  }
}
