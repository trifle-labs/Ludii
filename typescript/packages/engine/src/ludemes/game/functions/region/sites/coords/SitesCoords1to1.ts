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
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";
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
registerRegion1to1("sites:coords", (node: LudNode, _env: Compile1to1Env): RegionFunction => {
  void _env;
  const { positional } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);
  // positional[0] = "Coords" ident (the subtype); positional[1..] = coord strings or a list
  const coords: string[] = [];
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i]!;
    if (isString(p)) {
      coords.push(p.value);
    } else if (isIdent(p) && !p.name.endsWith(":")) {
      // Sometimes coords appear as idents without quotes (e.g. A1 as identifier)
      coords.push(p.name);
    }
  }
  // Also handle (sites Coords { "A1" "B2" ... }) with curly list
  const firstArg = positional[1];
  const firstArgAny = firstArg as unknown as { delimiter?: string; items?: LudNode[] };
  if (coords.length === 0 && firstArg && firstArgAny.delimiter === "curly") {
    const items = firstArgAny.items ?? [];
    for (const item of items) {
      if (isString(item)) coords.push(item.value);
      else if (isIdent(item)) coords.push(item.name);
    }
  }
  return new SitesCoords1to1(coords);
});
