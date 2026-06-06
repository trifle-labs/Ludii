// @java Core/src/game/functions/region/sites/coords/SitesCoords.java

/**
 * Returns all the sites with the given coordinates.
 *
 * @java game/functions/region/sites/coords/SitesCoords.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns the site indices matching a list of algebraic coordinate strings.
 * Delegates to the SiteFinder/Topology API via escape hatch, falling back to
 * the algebraic conversion used by SitesCoords1to1.
 *
 * @java game.functions.region.sites.coords.SitesCoords
 */
export class SitesCoords extends BaseRegionFunction {
  /** @java SitesCoords — private Region precomputedRegion = null */
  private precomputedRegion: number[] | null = null;
  /** @java SitesCoords — private final String[] coords */
  private readonly coords: readonly string[];

  /**
   * @java SitesCoords(SiteType, String[])
   * @param siteType Graph element type (null = board default).
   * @param coords   The coordinate strings (e.g. "A1", "B3").
   */
  public constructor(siteType: string | null, coords: readonly string[]) {
    super();
    this.siteType = siteType;
    this.coords = coords;
  }

  /**
   * @java SitesCoords.eval(Context)
   * Returns the site indices for the stored coordinate strings.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesCoords.java:60-61 — return precomputed if available
    if (this.precomputedRegion !== null) return this.precomputedRegion;

    const sites: number[] = [];
    const ctxAny = ctx as unknown as {
      board?: () => {
        topology?: () => {
          cells?: () => Array<{ label?: () => string; index?: () => number }>;
          vertices?: () => Array<{ label?: () => string; index?: () => number }>;
        };
        defaultSite?: () => string;
      };
      game?: { equipment?: { board?: { width?: number; height?: number } } };
    };

    // @java SitesCoords.java:63-72 — look up each coord via SiteFinder.find
    for (const coord of this.coords) {
      const el = this._findElement(ctxAny, coord);
      if (el !== null && el >= 0) {
        sites.push(el);
      }
    }

    return sites;
  }

  /**
   * Find the site index for a coordinate string using the board topology or
   * algebraic conversion.
   */
  private _findElement(
    ctxAny: {
      board?: () => {
        topology?: () => {
          cells?: () => Array<{ label?: () => string; index?: () => number }>;
          vertices?: () => Array<{ label?: () => string; index?: () => number }>;
        };
        defaultSite?: () => string;
      };
      game?: { equipment?: { board?: { width?: number; height?: number } } };
    },
    coord: string,
  ): number {
    const board = ctxAny.board?.();
    if (board) {
      const topo = board.topology?.();
      const siteType = this.siteType ?? board.defaultSite?.() ?? "Cell";
      if (siteType === "Cell" && topo?.cells) {
        for (const cell of topo.cells()) {
          if (cell.label?.() === coord) return cell.index?.() ?? -1;
        }
      } else if (siteType === "Vertex" && topo?.vertices) {
        for (const vertex of topo.vertices()) {
          if (vertex.label?.() === coord) return vertex.index?.() ?? -1;
        }
      }
    }
    // Fallback: algebraic conversion (A=col, digit=row)
    const W = ctxAny.game?.equipment?.board?.width ?? 0;
    if (!coord || coord.length < 2 || W <= 0) return -1;
    const col = coord.charCodeAt(0) - 65; // 'A' = 65
    const row = parseInt(coord.slice(1), 10) - 1;
    if (col < 0 || row < 0) return -1;
    return row * W + col;
  }

  /** @java SitesCoords.isStatic() */
  public override isStatic(): boolean {
    return true;
  }
}
