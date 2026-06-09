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
  public constructor(
    siteType: string | null | readonly string[] = null,
    coords: readonly string[] | string | null = null,
  ) {
    super();
    if (isStringArrayLike(siteType)) {
      this.siteType = null;
      this.coords = normaliseCoords(siteType);
    } else if (typeof siteType === "string" && !isSiteType(siteType) && coords === null) {
      this.siteType = null;
      this.coords = [siteType];
    } else {
      this.siteType = siteType;
      this.coords = normaliseCoords(coords);
    }
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
          getElement?: (coord: string, type: string | null) => { index(): number } | null;
          findByCoord?: (coord: string, type: string) => { index(): number } | null;
          cells?: () => Array<{ label?: () => string; index?: () => number }>;
          vertices?: () => Array<{ label?: () => string; index?: () => number }>;
        };
        defaultSite?: () => string;
        numSites?: () => number;
      };
      game?: { equipment?: { board?: { width?: number; height?: number } }; width?: number; height?: number; numSites?: number };
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
          getElement?: (coord: string, type: string | null) => { index(): number } | null;
          findByCoord?: (coord: string, type: string) => { index(): number } | null;
          cells?: () => Array<{ label?: () => string; index?: () => number }>;
          vertices?: () => Array<{ label?: () => string; index?: () => number }>;
        };
        defaultSite?: () => string;
        numSites?: () => number;
      };
      game?: { equipment?: { board?: { width?: number; height?: number } }; width?: number; height?: number; numSites?: number };
    },
    coord: string,
  ): number {
    const board = ctxAny.board?.();
    if (board) {
      const topo = board.topology?.();
      const siteType = this.siteType ?? board.defaultSite?.() ?? "Cell";
      const direct = topo?.getElement?.(coord, this.siteType ?? null) ?? topo?.findByCoord?.(coord, siteType) ?? null;
      if (direct !== null) return direct.index();
      if (siteType === "Cell" && topo?.cells) {
        for (const cell of topo.cells()) {
          if (sameCoord(cell.label?.(), coord)) return cell.index?.() ?? -1;
        }
      } else if (siteType === "Vertex" && topo?.vertices) {
        for (const vertex of topo.vertices()) {
          if (sameCoord(vertex.label?.(), coord)) return vertex.index?.() ?? -1;
        }
      }
    }
    // Fallback: algebraic conversion (A=col, digit=row)
    const W = ctxAny.game?.equipment?.board?.width ?? ctxAny.game?.width ?? 0;
    const H = ctxAny.game?.equipment?.board?.height ?? ctxAny.game?.height ?? 0;
    const parsed = parseAlgebraicCoord(coord);
    if (parsed === null || W <= 0) return -1;
    const { col, row } = parsed;
    if (H > 0 && row >= H) return -1;
    return row * W + col;
  }

  /** @java SitesCoords.isStatic() */
  public override isStatic(): boolean {
    return true;
  }
}

function normaliseCoords(value: readonly string[] | string | null | undefined): readonly string[] {
  if (typeof value === "string") return [value];
  if (isStringArrayLike(value)) return [...value];
  return [];
}

function isStringArrayLike(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isSiteType(value: string): boolean {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function sameCoord(label: string | undefined, coord: string): boolean {
  return label !== undefined && label.toLowerCase() === coord.toLowerCase();
}

function parseAlgebraicCoord(coord: string): { col: number; row: number } | null {
  const match = coord.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  let col = 0;
  for (const ch of match[1]!.toUpperCase()) {
    col = col * 26 + (ch.charCodeAt(0) - 64);
  }
  const row = Number.parseInt(match[2]!, 10) - 1;
  if (col <= 0 || !Number.isFinite(row) || row < 0) return null;
  return { col: col - 1, row };
}
