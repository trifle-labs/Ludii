/**
 * Directions1to1.ts
 * @java Core/src/game/functions/directions/Directions.java
 *
 * (directions <AbsoluteDirection>)              — returns the direction name as a singleton list
 * (directions {<AbsoluteDirection>})            — returns the list of direction names
 * (directions Cell from:<intFn> to:<intFn>)     — compute direction between two sites
 *
 * In the 1:1 path eval(ctx) returns string[] of Trajectories direction names.
 * AbsoluteDirection and from/to forms are ported faithfully.
 * RelativeDirection and Random forms are DEFERRED.
 *
 * @java Core/src/game/functions/directions/Directions.java — eval
 * @java Core/src/game/util/directions/AbsoluteDirection.java — name()
 */

import type { Context } from "../../../../context.js";
import type { IntFunction, DirectionsFunction } from "../../../base.js";
import type { LudList, LudNode } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import {
  registerDirections1to1,
  type Compile1to1Env,
} from "../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../compiler1to1.js";
import type { Game1to1 } from "../../../Game1to1.js";

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

// Site-type idents that may prefix the from/to form of (directions Cell from:X to:Y)
const SITE_TYPE_IDENTS = new Set(["cell", "edge", "vertex"]);

/**
 * Dynamic DirectionsFunction for (directions Cell from:<intFn> to:<intFn>).
 * Computes the AbsoluteDirection on a square board from `from` site toward `to` site
 * by examining the vector (dr, dc) between the two sites.
 *
 * @java game/functions/directions/Directions.java — convertToAbsolute (siteType form, lines 411-446)
 * Java iterates radials from `from` to find which direction contains `to`.
 * For square boards this is equivalent to checking the (dr,dc) sign vector.
 */
class Directions1to1FromTo implements DirectionsFunction {
  private readonly fromFn: IntFunction;
  private readonly toFn: IntFunction;

  public constructor(fromFn: IntFunction, toFn: IntFunction) {
    this.fromFn = fromFn;
    this.toFn = toFn;
  }

  /**
   * Compute the compass direction from site `from` toward site `to` on a square board.
   * Returns a singleton list with the direction name, or empty list if sites are
   * equal or not on a common orthogonal/diagonal line.
   *
   * Uses Ludii's coordinate convention where row index 0 is the BOTTOM row and
   * increases going UPWARD (like a chess board). This matches `buildFlatRadials`
   * (topology-radials.ts) where N=(dx=0,dy=+1), S=(dx=0,dy=-1), NE=(+1,+1) etc.
   *
   * @java Directions.java:411-446 — iterates radials from `from`, finds which contains `to`.
   */
  public eval(ctx: Context): string[] {
    const from = this.fromFn.eval(ctx);
    const to = this.toFn.eval(ctx);
    if (from < 0 || to < 0 || from === to) return [];

    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment?.board?.width ?? 0;
    if (W <= 0) return [];

    // x = column (0=left), y = row (0=BOTTOM in Ludii convention)
    const fromY = Math.floor(from / W);  // row = y in Ludii bottom-origin system
    const fromX = from % W;              // col = x
    const toY = Math.floor(to / W);
    const toX = to % W;

    const dy = toY - fromY;  // +1 = going UP (North), -1 = going DOWN (South)
    const dx = toX - fromX;  // +1 = going RIGHT (East), -1 = going LEFT (West)

    // Must be on a common orthogonal or diagonal line
    if (dy !== 0 && dx !== 0 && Math.abs(dy) !== Math.abs(dx)) return [];

    const sy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
    const sx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);

    // Map (sy=row-sign, sx=col-sign) → compass direction name.
    // In Ludii bottom-origin: N=+y, S=-y, E=+x, W=-x, NE=(+x,+y), etc.
    // @java buildFlatRadials: N=(0,+1), S=(0,-1), E=(+1,0), W=(-1,0)
    //                         NE=(+1,+1), NW=(-1,+1), SE=(+1,-1), SW=(-1,-1)
    if (sy === 1  && sx === 0) return ["N"];
    if (sy === -1 && sx === 0) return ["S"];
    if (sy === 0  && sx === 1) return ["E"];
    if (sy === 0  && sx === -1) return ["W"];
    if (sy === 1  && sx === 1) return ["NE"];
    if (sy === 1  && sx === -1) return ["NW"];
    if (sy === -1 && sx === 1) return ["SE"];
    if (sy === -1 && sx === -1) return ["SW"];
    return [];
  }
}

registerDirections1to1(
  "directions",
  (node: LudNode, _env: Compile1to1Env): DirectionsFunction => {
    const { positional, named } = parseArgs1to1((node as LudList).items);

    // --- (directions Cell from:<intFn> to:<intFn>) — direction between two sites ---
    // @java Directions.java — constructor(SiteType type, IntFunction from, IntFunction to)
    // Detected by: first positional is a SiteType ident AND from:/to: named params present.
    const fromNode = named.get("from");
    const toNode = named.get("to");
    if (fromNode && toNode) {
      try {
        const fromFn = compileInt1to1(fromNode);
        const toFn = compileInt1to1(toNode);
        return new Directions1to1FromTo(fromFn, toFn);
      } catch { /* fall through to absolute direction form */ }
    }

    // --- (directions AbsoluteDirection) / (directions {AbsoluteDirection...}) ---
    // Collect all positional AbsoluteDirection ident args, skip non-ident / non-absolute.
    // Java: @Or AbsoluteDirection absoluteDirection, @Or AbsoluteDirection[] absoluteDirections
    const names: string[] = [];
    for (const p of positional) {
      if (isIdent(p)) {
        if (ABSOLUTE_DIRECTION_NAMES.has(p.name)) {
          names.push(p.name);
        } else if (SITE_TYPE_IDENTS.has(p.name.toLowerCase())) {
          continue; // skip Cell/Edge/Vertex qualifier — handled above via named params
        }
        // RelativeDirection idents: deferred — no piece-facing API.
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
