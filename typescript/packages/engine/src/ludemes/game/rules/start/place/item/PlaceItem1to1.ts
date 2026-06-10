/**
 * @java game/rules/start/place/item/PlaceItem.java
 *
 * Places a piece (or set of pieces) at the given site(s) as part of the
 * initial game setup.  This is the primary non-stack, non-puzzle placement
 * ludeme; it mirrors PlaceItem.eval(Context).
 *
 * Limitations (deferred):
 *  - Stack placement (isStack=true) is not supported — see PlaceCustomStack /
 *    PlaceMonotonousStack for that path.
 *  - Deduction-puzzle variant (evalPuzzle) is not supported — ActionSet is
 *    absent from applyToInitialState.
 *  - Container-based placement for non-Hand containers is not supported —
 *    the TS Equipment1to1 only exposes hand sites.
 *  - The "stringWithoutNumber / Hand" loop (player-suffixed generic piece) is
 *    not supported; use PlaceHandCount for those cases.
 *  - coord-based placement relies on algebraicToSite which only handles
 *    single-letter, fixed-width boards.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { Piece } from "../../../../equipment/component/Piece.js"; // game/equipment/component/
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";
import type { Context } from "../../../../../../context.js";
import type { Game1to1 } from "../../../../../Game1to1.js";
import { IntConstant } from "../../../../functions/ints/IntConstant.js";

/** Java constant: OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/start/place/item/PlaceItem.java
 */
export class PlaceItem1to1 implements StartRule {
  /** @java PlaceItem.item */
  private readonly item: string;

  /** @java PlaceItem.container — null for board placement */
  private readonly container: string | null;

  /** @java PlaceItem.siteId — single-site location */
  private readonly siteId: IntFunction | null;

  /** @java PlaceItem.coord — algebraic coordinate string */
  private readonly coord: string | null;

  /** @java PlaceItem.countFn — number of pieces to place, default 1 */
  private readonly countFn: IntFunction;

  /** @java PlaceItem.stateFn — site-state, default OFF */
  private readonly stateFn: IntFunction;

  /** @java PlaceItem.rotationFn — rotation, default OFF */
  private readonly rotationFn: IntFunction;

  /** @java PlaceItem.valueFn — piece value, default OFF */
  private readonly valueFn: IntFunction;

  /** @java PlaceItem.type — Cell, Edge or Vertex */
  private readonly type: string | null;

  // ------ region/fill fields -------------------------------------------------

  /** @java PlaceItem.locationIds — multiple locations */
  private readonly locationIds: readonly IntFunction[] | null;

  /** @java PlaceItem.region — region to fill */
  private readonly region: RegionFunction | null;

  /** @java PlaceItem.coords — multiple algebraic coordinates */
  private readonly coords: readonly string[] | null;

  /** @java PlaceItem.countsFn — per-site counts when using region/locs */
  private readonly countsFn: readonly IntFunction[] | null;

  // ---------------------------------------------------------------------------

  /**
   * Single-site constructor.
   * @java PlaceItem(String item, String container, SiteType type,
   *                IntFunction loc, String coord, IntFunction count,
   *                IntFunction state, IntFunction rotation, IntFunction value)
   */
  public constructor(
    item: string,
    container?: string | null,
    type?: string | null,
    loc?: IntFunction | null,
    coord?: string | null,
    count?: IntFunction | null,
    state?: IntFunction | null,
    rotation?: IntFunction | null,
    value?: IntFunction | null,
  );

  /**
   * Region/multi-site constructor.
   * @java PlaceItem(String item, SiteType type, IntFunction[] locs,
   *                RegionFunction region, String[] coords,
   *                IntFunction[] counts, IntFunction state,
   *                IntFunction rotation, IntFunction value)
   */
  public constructor(
    item: string,
    type?: string | null,
    locs?: readonly IntFunction[] | null,
    region?: RegionFunction | null,
    coords?: readonly string[] | null,
    counts?: readonly IntFunction[] | null,
    state?: IntFunction | null,
    rotation?: IntFunction | null,
    value?: IntFunction | null,
  );

  public constructor(
    item: string,
    containerOrType: string | null = null,
    typeOrLocs: string | readonly IntFunction[] | null = null,
    locOrRegion: IntFunction | RegionFunction | null = null,
    coordOrCoords: string | readonly string[] | null = null,
    countOrCounts: IntFunction | readonly IntFunction[] | null = null,
    state: IntFunction | null = null,
    rotation: IntFunction | null = null,
    value: IntFunction | null = null,
  ) {
    this.item = item;
    this.stateFn = state ?? new IntConstant(OFF);
    this.rotationFn = rotation ?? new IntConstant(OFF);
    this.valueFn = value ?? new IntConstant(OFF);

    const isFillConstructor =
      Array.isArray(typeOrLocs) ||
      Array.isArray(coordOrCoords) ||
      Array.isArray(countOrCounts) ||
      (isSiteTypeName(containerOrType) && (typeOrLocs === null || Array.isArray(typeOrLocs)));

    if (isFillConstructor) {
      const locs = Array.isArray(typeOrLocs) ? typeOrLocs : null;
      const coords = Array.isArray(coordOrCoords) ? coordOrCoords : null;
      const counts = Array.isArray(countOrCounts) ? countOrCounts : null;

      this.container = null;
      this.siteId = null;
      this.coord = null;
      this.type = containerOrType;
      this.locationIds = locs;
      this.region = locOrRegion as RegionFunction | null;
      this.coords = coords;
      this.countFn = counts === null ? new IntConstant(1) : (counts[0] ?? new IntConstant(1));
      this.countsFn = counts === null ? [] : counts.slice();
    } else {
      this.container = containerOrType;
      this.siteId = locOrRegion as IntFunction | null;
      this.coord = typeof coordOrCoords === "string" ? coordOrCoords : null;
      const count = Array.isArray(countOrCounts) ? null : (countOrCounts as IntFunction | null);
      this.countFn = count ?? new IntConstant(1);
      this.locationIds = null;
      this.region = null;
      this.coords = null;
      this.countsFn = null;
      this.type = typeof typeOrLocs === "string" ? typeOrLocs : null;
    }
  }

  /**
   * @java PlaceItem.eval(Context)
   *
   * Dispatches to:
   *  - evalFill (region / multi-site placement)
   *  - single-site placement (coord or siteId, no container)
   *
   * Deferred: deduction-puzzle path, container-based (non-hand), stacking.
   */
  /** @java PlaceItem.eval(Context) — bridge arrays + facade equipment. */
  public eval(ctx: Context): void {
    const a = (ctx as unknown as {
      _startArrays?: { cells: number[]; whats: number[]; countAt: number[]; stateAt: number[]; valueAt: number[] };
    })._startArrays;
    if (!a) return;
    const g = ctx.game as unknown as { equipment: Equipment1to1; numPlayers: number };
    this.applyImpl(a.cells, a.whats, a.countAt, g.equipment, g.numPlayers, ctx);
  }

  private applyImpl(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    ctx: Context,
  ): void {
    // The REAL bridge context (Java evaluates start args on the live context).
    const fakeCtx = ctx;

    // Java: if (locationIds != null || region != null || coords != null || countsFn != null)
    if (
      this.locationIds !== null ||
      this.region !== null ||
      this.coords !== null ||
      this.countsFn !== null
    ) {
      this.evalFill(cells, whats, countAt, equipment, numPlayers, fakeCtx);
      return;
    }

    // Java: else if (context.game().isDeductionPuzzle()) → evalPuzzle (deferred)

    // Java: else — single-site placement
    const count = this.evalInt(this.countFn, fakeCtx, 1);
    // state/rotation/value not used by applyToInitialState but evaluated faithfully
    // const state = this.evalInt(this.stateFn, fakeCtx, OFF);
    // const rotation = this.evalInt(this.rotationFn, fakeCtx, OFF);
    // const value = this.evalInt(this.valueFn, fakeCtx, OFF);

    // --- hand / container placement ---
    if (this.container !== null) {
      if (this.container.toLowerCase().includes("hand")) {
        // Java: Start.placePieces(context, siteFrom, c.index(), count, ...)
        // Place in each matching player hand.
        const nameOnly = this.item.replace(/\d+$/, "");
        for (let p = 1; p <= numPlayers; p++) {
          const handSite = equipment.handSiteFor(p, 0);
          if (handSite < 0 || handSite >= cells.length) continue;
          const piece = equipment.pieces.find(
            (pi: Piece) => pi.owner === p && pi.name.toLowerCase() === nameOnly.toLowerCase(),
          );
          if (piece === undefined) continue;
          cells[handSite] = p;
          whats[handSite] = piece.index;
          countAt[handSite] = count;
        }
        return;
      }
      // Other containers: deferred (no container index map in Equipment1to1)
      return;
    }

    // --- board placement ---
    if (this.siteId === null && this.coord === null) return;

    let site = -1;
    if (this.coord !== null) {
      // Java: TopologyElement element = SiteFinder.find(context.board(), coord, type)
      site = algebraicToSite(this.coord, equipment.board.width, equipment.board.height);
      if (site < 0) return;
    } else if (this.siteId !== null) {
      // Java: site = siteId.eval(context)
      try {
        site = this.siteId.eval(fakeCtx);
      } catch {
        return;
      }
    }

    if (site < 0 || site >= cells.length) return;

    const piece = resolveComponent(this.item, equipment);
    if (piece === null) return;

    // Java: Start.placePieces(context, site, what, count, state, rotation, value, false, type)
    cells[site] = piece.owner;
    whats[site] = piece.index;
    countAt[site] = count;
  }

  /**
   * @java PlaceItem.evalFill(Context)
   *
   * Region/multi-site placement — mirrors Java evalFill without container path.
   */
  private evalFill(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    fakeCtx: Context,
  ): void {
    const piece = resolveComponent(this.item, equipment);
    if (piece === null) return;

    const count = this.evalInt(this.countFn, fakeCtx, 1);

    // Java: if (container != null) → container-based fill (deferred)

    // Java: if (coords != null)
    if (this.coords !== null) {
      for (const coordinate of this.coords) {
        // Java: TopologyElement element = SiteFinder.find(context.board(), coordinate, type)
        const site = algebraicToSite(coordinate, equipment.board.width, equipment.board.height);
        if (site < 0) continue;
        if (site >= cells.length) continue;
        // Java: Start.placePieces(context, element.index(), what, count, ...)
        cells[site] = piece.owner;
        whats[site] = piece.index;
        countAt[site] = count;
      }
      return;
    }

    // Java: else if (region != null)
    if (this.region !== null) {
      let sites: number[];
      try {
        sites = this.region.eval(fakeCtx);
      } catch {
        return;
      }
      for (let k = 0; k < sites.length; k++) {
        const loc = sites[k]!;
        if (loc < 0 || loc >= cells.length) continue;
        // Java: countsFn.length == 0 ? countFn.eval(context) : countsFn[k].eval(context)
        const countsFn = this.countsFn ?? [];
        const c =
          countsFn.length === 0
            ? count
            : this.evalInt(countsFn[k] ?? countsFn[countsFn.length - 1]!, fakeCtx, count);
        cells[loc] = piece.owner;
        whats[loc] = piece.index;
        countAt[loc] = c;
      }
      return;
    }

    // Java: else if (locationIds != null)
    if (this.locationIds !== null) {
      for (let k = 0; k < this.locationIds.length; k++) {
        let loc: number;
        try {
          loc = this.locationIds[k]!.eval(fakeCtx);
        } catch {
          continue;
        }
        if (loc < 0 || loc >= cells.length) continue;
        const countsFn = this.countsFn ?? [];
        const c =
          countsFn.length === 0
            ? count
            : this.evalInt(countsFn[k] ?? countsFn[countsFn.length - 1]!, fakeCtx, count);
        cells[loc] = piece.owner;
        whats[loc] = piece.index;
        countAt[loc] = c;
      }
    }
  }

  /** Safe IntFunction evaluation. */
  private evalInt(fn: IntFunction, ctx: Context, fallback: number): number {
    try {
      return fn.eval(ctx);
    } catch {
      return fallback;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a Ludii piece-name (e.g. "Pawn1") to the matching Piece in equipment.
 * @java Game.getComponent(String name)
 */
function resolveComponent(
  item: string,
  equipment: Equipment1to1,
): Piece | null {
  const match = item.match(/^(.*?)(\d+)$/);
  if (!match) {
    // No player suffix — find neutral (owner=0) piece
    const piece = equipment.pieces.find(
      (p: Piece) => p.name.toLowerCase() === item.toLowerCase(),
    );
    return piece ?? null;
  }
  const pieceName = match[1]!;
  const owner = parseInt(match[2]!, 10);
  const piece = equipment.pieces.find(
    (p: Piece) => p.owner === owner && p.name.toLowerCase() === pieceName.toLowerCase(),
  );
  return piece ?? null;
}

/**
 * Convert algebraic coordinate to site index.
 * @java other/topology/SiteFinder.find(board, coord, type)
 */
function algebraicToSite(coord: string, boardWidth: number, _boardHeight: number): number {
  if (boardWidth <= 0) return -1;
  const match = coord.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return -1;
  const colStr = match[1]!.toUpperCase();
  if (colStr.length !== 1) return -1;
  const col = colStr.charCodeAt(0) - 65;
  const rowNum = parseInt(match[2]!, 10);
  if (isNaN(rowNum) || rowNum < 1 || col < 0 || col >= boardWidth) return -1;
  const row = rowNum - 1;
  return row * boardWidth + col;
}

function isSiteTypeName(value: unknown): value is string {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}


// Re-export OFF for consumers (mirrors Java Constants.OFF = -1).
export { OFF };
