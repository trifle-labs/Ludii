/**
 * Directions1to1.ts
 * @java Core/src/game/functions/directions/Directions.java
 *
 * (directions <AbsoluteDirection>)   — returns the direction name as a singleton list
 * (directions {<AbsoluteDirection>}) — returns the list of direction names
 *
 * In the 1:1 path eval(ctx) returns string[] of Trajectories direction names.
 * Only the AbsoluteDirection form is ported faithfully here; RelativeDirection,
 * siteType from:/to:, and Random forms are DEFERRED (require piece-facing API
 * or stochastic context that is not available in the eval path).
 *
 * @java Core/src/game/functions/directions/Directions.java — eval
 * @java Core/src/game/util/directions/AbsoluteDirection.java — name()
 */

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";
import type { LudList, LudNode } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import {
  registerDirections1to1,
  type Compile1to1Env,
} from "../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../compiler1to1.js";

// The known AbsoluteDirection names (Java AbsoluteDirection enum names).
// Matches the TS AbsoluteDirection enum in absolute-direction.ts.
const ABSOLUTE_DIRECTION_NAMES = new Set<string>([
  "All", "Angled", "Adjacent", "Axial", "Orthogonal", "Diagonal",
  "OffDiagonal", "SameLayer", "Upward", "Downward", "Rotational",
  "Base", "Support",
  "N", "E", "S", "W", "NE", "SE", "NW", "SW",
  "NNW", "WNW", "WSW", "SSW", "SSE", "ESE", "ENE", "NNE",
  "CW", "CCW", "In", "Out",
  "U", "UN", "UNE", "UE", "USE", "US", "USW", "UW", "UNW",
  "D", "DN", "DNE", "DE", "DSE", "DS", "DSW", "DW", "DNW",
]);

/**
 * A Directions ludeme where the direction list is fully determined at
 * compile time (AbsoluteDirection form).  eval(ctx) is a pure constant.
 * @java Directions.java — constructor(AbsoluteDirection absoluteDirection, AbsoluteDirection[] absoluteDirections)
 */
export class Directions1to1Static implements DirectionsFunction {
  private readonly names: readonly string[];

  public constructor(names: readonly string[]) {
    this.names = names;
  }

  /** @java Directions.java — convertToAbsolute when absoluteDirections != null (precomputed) */
  public eval(_ctx: Context): string[] {
    return this.names as string[];
  }
}

registerDirections1to1(
  "directions",
  (node: LudNode, _env: Compile1to1Env): DirectionsFunction => {
    const { positional } = parseArgs1to1((node as LudList).items);

    // Collect all positional AbsoluteDirection ident args, skip non-ident / non-absolute.
    // Java: @Or AbsoluteDirection absoluteDirection, @Or AbsoluteDirection[] absoluteDirections
    const names: string[] = [];
    for (const p of positional) {
      if (isIdent(p)) {
        if (ABSOLUTE_DIRECTION_NAMES.has(p.name)) {
          names.push(p.name);
        }
        // RelativeDirection idents: deferred — no piece-facing API.
        // SiteType idents: deferred (from:/to: form not handled here).
        // RandomDirectionType: deferred (stochastic).
      } else if (isList(p) && p.delimiter === "curly") {
        // (directions {NE NW SE SW}) — curly list of direction names
        for (const item of p.items) {
          if (isIdent(item) && ABSOLUTE_DIRECTION_NAMES.has(item.name)) {
            names.push(item.name);
          }
        }
      }
    }

    if (names.length === 0) {
      // Fallback: default to Adjacent (Java default for empty relativeDirections list)
      return new Directions1to1Static(["Adjacent"]);
    }

    return new Directions1to1Static(names);
  },
);
