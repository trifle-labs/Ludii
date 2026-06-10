// @java Core/src/game/functions/booleans/is/integer/IsFlat.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (is Flat)
 * In a 3D board, checks that a site's piece is supported (layer 0 or has support below).
 * In 2D games (which is all the 1:1 path currently handles), always returns true.
 *
 * @java game/functions/booleans/is/integer/IsFlat.java
 * @remarks IsFlat is only meaningful in 3D (Shibumi-like) games. Since the 1:1
 *   engine handles 2D boards only, layer == 0 is always true and this returns true.
 */
export class IsFlat1to1 implements BooleanFunction {
  /** @java IsFlat.eval(Context): layer == 0 → true; check support → full 3D logic */
  public eval(_ctx: Context): boolean {
    // Java: if (v.layer() == 0) return true; else check whether all 4 support sites are occupied.
    // In 1:1 engine all boards are 2D (layer 0), so always return true.
    return true;
  }
}

