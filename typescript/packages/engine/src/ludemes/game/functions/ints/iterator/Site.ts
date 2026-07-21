// @java Core/src/game/functions/ints/iterator/Site.java

/**
 * Returns the "site" iterator value (set by ForEach Site and friends).
 *
 * @java game/functions/ints/iterator/Site.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Site extends BaseIntFunction {
  /** @java Site() */
  public constructor() { super(); }

  /** @java Site.eval(Context) — return context.site(); */
  public override eval(context: Context): number {
    return (context as unknown as { site(): number }).site();
  }

  /** @java Site.isStatic() */
  public isStatic(): boolean { return false; }
}
