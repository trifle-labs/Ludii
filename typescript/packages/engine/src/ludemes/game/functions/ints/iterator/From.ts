// @java Core/src/game/functions/ints/iterator/From.java

/**
 * Iterator1to1.ts
 *
 * Faithful 1:1 ports of iterator int ludemes:
 *   From, To, Site, Between, Level, Pips, Track, Edge, Hint
 *
 * @java game/functions/ints/iterator/From.java
 * @java game/functions/ints/iterator/To.java
 * @java game/functions/ints/iterator/Site.java
 * @java game/functions/ints/iterator/Between.java
 * @java game/functions/ints/iterator/Level.java
 * @java game/functions/ints/iterator/Pips.java
 * @java game/functions/ints/iterator/Track.java
 * @java game/functions/ints/iterator/Edge.java
 * @java game/functions/ints/iterator/Hint.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";

// ---------------------------------------------------------------------------
// From
// ---------------------------------------------------------------------------
export class From implements IntFunction {
  /** @java game/functions/ints/iterator/From.java — eval: context.from() */
  public eval(ctx: Context): number {
    return ctx._evalFrom;
  }
}
