/**
 * SitesCoords1to1.ts
 * @java game/functions/region/sites/coords/SitesCoords.java
 *
 * (sites Coords "A1" "B2" ...) — returns the site indices for the given
 * algebraic coordinate strings.
 *
 * Java eval (SitesCoords.java:59-73):
 *   For each coord string, look up the TopologyElement via SiteFinder.find
 *   and collect its index.
 *
 * TS simplification: convert algebraic coord strings to site indices using
 * the board's width (column = letter - 'A', row = digit - 1).
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isString, isIdent } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * Convert an algebraic coordinate like "A4", "B10" to a linear site index.
 * @java other/topology/SiteFinder.java — SiteFinder.find(board, coord, type)
 * Row 1 is at the bottom (index 0), row N at the top.
 * Column A is leftmost (index 0).
 */
function algebraicToSite(coord: string, W: number, _H: number): number {
  if (!coord || coord.length < 2) return -1;
  const col = coord.charCodeAt(0) - 65; // 'A' = 65
  const row = parseInt(coord.slice(1), 10) - 1;
  if (col < 0 || row < 0 || W <= 0) return -1;
  return row * W + col;
}

export class SitesCoords1to1 implements RegionFunction {
  private readonly coords: readonly string[];

  /**
   * @java game/functions/region/sites/coords/SitesCoords.java — constructor
   * @param coords Algebraic coordinate strings like "A1", "B3"
   */
  public constructor(coords: readonly string[]) {
    this.coords = coords;
  }

  /**
   * @java game/functions/region/sites/coords/SitesCoords.java — eval(Context)
   * Returns site indices for the stored algebraic coordinates.
   */
  public eval(ctx: Context): number[] {
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    if (W <= 0) return [];
    const result: number[] = [];
    for (const coord of this.coords) {
      const site = algebraicToSite(coord, W, H);
      if (site >= 0) result.push(site);
    }
    return result;
  }
}

// Key: (sites Coords "A1" "B2" ...) → first positional ident "Coords" → key "sites:coords"
