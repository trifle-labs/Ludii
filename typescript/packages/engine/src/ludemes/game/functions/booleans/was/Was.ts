// @java Core/src/game/functions/booleans/was/Was.java

/**
 * Static factory for the (was …) booleans.
 *
 * @java game/functions/booleans/was/Was.java
 * @author Eric.Piette
 */

import { WasPass } from "./WasPass.js";

export class Was {
  private constructor() { /* static-factory-only, like Java */ }

  /** @java Was.construct(WasType wasType) */
  public static construct(wasType: string): WasPass {
    if (wasType === "Pass") return new WasPass();
    throw new Error(`Was(): A WasType is not implemented: ${wasType}`);
  }
}
