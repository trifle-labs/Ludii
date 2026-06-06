// @java Core/src/game/equipment/other/Regions.java

/**
 * Defines a static region on the board.
 *
 * @java game/equipment/other/Regions.java Regions
 * @author Eric.Piette and cambolbro
 */

import { Item, type RoleType, type GameLike } from "../Item.js";
import type { RegionFunction } from "../../functions/region/RegionFunction.js";
import { type RegionTypeStatic } from "../../types/board/RegionTypeStatic.js";
import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import type { TopologyElement, SiteType } from "../../../other/topology/TopologyElement.js";
import type { Topology } from "../../../other/topology/Topology.js";
import type { Cell } from "../../../other/topology/Cell.js";
import { Region } from "../../util/equipment/Region.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Context-like interface needed by Regions.eval and convertStaticRegionOnLocs.
 * @java other.context.Context
 */
interface RegionsContext {
  topology(): Topology;
  board(): {
    defaultSite(): SiteType;
    topology(): Topology & {
      corners(type: SiteType): TopologyElement[];
      sides(type: SiteType): globalThis.Map<string, TopologyElement[]>;
      getGraphElements(type: SiteType): TopologyElement[];
      columns(type: SiteType): TopologyElement[][];
      rows(type: SiteType): TopologyElement[][];
      diagonals(type: SiteType): TopologyElement[][];
      layers(type: SiteType): TopologyElement[][];
      cells(): Cell[];
      vertices(): TopologyElement[];
    };
  };
  game(): {
    equipment(): {
      verticesWithHints(): number[][];
      cellsWithHints(): number[][];
      edgesWithHints(): number[][];
    };
  };
}

/**
 * Defines a static region on the board.
 *
 * @java game/equipment/other/Regions.java Regions
 */
export class Regions extends Item {
  /** @java Regions.precomputedRegion */
  private _precomputedRegion: number[] | null = null;

  /** @java Regions.sites — explicit site indices */
  private readonly _sites: number[] | null;

  /** @java Regions.region — array of region functions */
  private readonly _region: RegionFunction[] | null;

  /** @java Regions.regionType — pre-computed static region types */
  private readonly _regionType: RegionTypeStatic[] | null;

  /** @java Regions.hintRegionName — name of the hint region */
  private readonly _hintRegionName: string | null;

  /**
   * @java game/equipment/other/Regions.java constructor
   *
   * @param name             The name of the region ["Region" + owner index].
   * @param role             The owner of the region [P1].
   * @param sites            The sites included in the region.
   * @param regionFn         The region function corresponding to the region.
   * @param regionsFn        The region functions corresponding to the region.
   * @param staticRegion     Pre-computed static region corresponding to this region.
   * @param staticRegions    Pre-computed static regions corresponding to this region.
   * @param hintRegionLabel  Name of this hint region (for deduction puzzles).
   */
  public constructor(
    name: string | null,
    role: RoleType | null,
    sites: number[] | null,
    regionFn: RegionFunction | null,
    regionsFn: RegionFunction[] | null,
    staticRegion: RegionTypeStatic | null,
    staticRegions: RegionTypeStatic[] | null,
    hintRegionLabel: string | null,
  ) {
    // @java Regions.java:83–84 — super(...)
    super(
      (name === null)
        ? ("Region" + ((role === null) ? "P1" : role))
        : name,
      UNDEFINED,
      "Neutral" as RoleType,
    );

    // @java Regions.java:86–101 — validate numNonNull == 1
    let numNonNull = 0;
    if (sites !== null)         numNonNull++;
    if (regionFn !== null)      numNonNull++;
    if (regionsFn !== null)     numNonNull++;
    if (staticRegion !== null)  numNonNull++;
    if (staticRegions !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    // @java Regions.java:103–110
    if (role !== null) {
      this.setRole(role);
    } else {
      this.setRole("Neutral" as RoleType);
    }

    // @java Regions.java:112–120
    if (sites !== null) {
      this._sites = [...sites];
    } else {
      this._sites = null;
    }

    // @java Regions.java:122
    this._region = (regionFn !== null) ? [regionFn] : regionsFn;
    // @java Regions.java:123
    this._regionType = (staticRegion !== null) ? [staticRegion] : staticRegions;
    // @java Regions.java:124
    this._hintRegionName = hintRegionLabel;

    // @java Regions.java:125
    this.setType("Regions");
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.sites()
   * @returns The sites of that region.
   */
  public sites(): number[] | null {
    return this._sites;
  }

  /**
   * @java Regions.region()
   * @returns The region functions of that region.
   */
  public region(): RegionFunction[] | null {
    return this._region;
  }

  /**
   * @java Regions.regionTypes()
   * @returns The list of all the static regions.
   */
  public regionTypes(): RegionTypeStatic[] | null {
    return this._regionType;
  }

  // ---------------------------------------------------------------------------
  // eval
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.eval(Context)
   * @param context The context.
   * @returns Array of site indices for given context.
   */
  public eval(context: Context & EvalScratch): number[] {
    // @java Regions.java:388–392 — return precomputed if cached
    if (this._precomputedRegion !== null) {
      return this._precomputedRegion;
    }

    if (this._region !== null) {
      // @java Regions.java:394–420 — union of all region evals
      const siteLists: number[][] = [];
      let totalNumSites = 0;

      for (const regionFn of this._region) {
        const sites = regionFn.eval(context);
        siteLists.push(sites);
        totalNumSites += sites.length;
      }

      const toReturn = new Array<number>(totalNumSites);
      let startIdx = 0;
      for (const sites of siteLists) {
        for (let i = 0; i < sites.length; i++) {
          toReturn[startIdx + i] = sites[i]!;
        }
        startIdx += sites.length;
      }

      if (siteLists.length > 1) {
        // @java Regions.java:415–419 — deduplicate via Region wrapper
        return new Region(toReturn).sites();
      }

      return toReturn;
    } else {
      // @java Regions.java:421 — return sites directly
      return this._sites ?? [];
    }
  }

  // ---------------------------------------------------------------------------
  // contains
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.contains(Context, int)
   * @param context  The context.
   * @param location The location.
   * @returns True if the given location is in this Regions.
   */
  public contains(context: Context & EvalScratch, location: number): boolean {
    // @java Regions.java:436–456
    if (this._region !== null) {
      for (const regionFn of this._region) {
        const containsFn = regionFn.contains;
        if (typeof containsFn === "function") {
          if (containsFn.call(regionFn, context, location)) return true;
        } else {
          if (regionFn.eval(context).includes(location)) return true;
        }
      }
      return false;
    } else {
      const siteArr = this._sites ?? [];
      for (const site of siteArr) {
        if (site === location) return true;
      }
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // isStatic / preprocess
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.isStatic()
   * @returns True if this Region is static (always returns the same region).
   */
  public isStatic(): boolean {
    // @java Regions.java:465 — stubbed to always return true in Java too
    return true;
  }

  /**
   * Does preprocessing for region functions in this region.
   * @java Regions.preprocess(Game)
   * @param game The game.
   */
  public preprocess(game: GameLike): void {
    // @java Regions.java:483–492
    if (this._region !== null) {
      for (const regionFunction of this._region) {
        (regionFunction as unknown as { preprocess?(g: GameLike): void }).preprocess?.(game);
      }
    }

    if (this.isStatic()) {
      // @java Regions.java:492 — precomputedRegion = eval(new Context(game, null))
      // Use escape hatch: create a minimal context with just the game
      const dummyCtx = { game } as unknown as Context & EvalScratch;
      this._precomputedRegion = this.eval(dummyCtx);
    }
  }

  // ---------------------------------------------------------------------------
  // convertStaticRegionOnLocs
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.convertStaticRegionOnLocs(RegionTypeStatic, Context)
   * @param type    The region type.
   * @param context The context.
   * @returns A list of locations corresponding to the area type.
   */
  public convertStaticRegionOnLocs(
    type: RegionTypeStatic,
    context: RegionsContext,
  ): number[][] | null {
    let regions: number[][] | null = null;
    const graph = context.board().topology();
    const defaultType = context.board().defaultSite();

    switch (type) {
      case "Corners": {
        // @java Regions.java:156–163
        const cornersList = graph.corners(defaultType);
        regions = new Array<number[]>(cornersList.length);
        for (let c = 0; c < cornersList.length; c++) {
          regions[c] = [cornersList[c]!.index()];
        }
        break;
      }

      case "Sides": {
        // @java Regions.java:164–175
        const sidesMap = graph.sides(defaultType);
        regions = [];
        for (const [, elements] of sidesMap) {
          const row: number[] = elements.map(e => e.index());
          regions.push(row);
        }
        break;
      }

      case "SidesNoCorners": {
        // @java Regions.java:176–204
        const cornersSNC = graph.corners(defaultType);
        const cornerIndices = new Set<number>(cornersSNC.map(c => c.index()));

        const sidesMapSNC = graph.sides(defaultType);
        regions = [];
        for (const [, elements] of sidesMapSNC) {
          const sideNoCorner: number[] = [];
          for (const element of elements) {
            if (!cornerIndices.has(element.index())) {
              sideNoCorner.push(element.index());
            }
          }
          regions.push(sideNoCorner);
        }
        break;
      }

      case "AllSites": {
        // @java Regions.java:205–208
        const allElements = graph.getGraphElements(defaultType);
        regions = [allElements.map((_el, i) => i)];
        break;
      }

      case "Columns": {
        // @java Regions.java:209–218
        const cols = graph.columns(defaultType);
        regions = new Array<number[]>(cols.length);
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i]!;
          regions[i] = col.map(e => e.index());
        }
        break;
      }

      case "Rows": {
        // @java Regions.java:219–228
        const rows = graph.rows(defaultType);
        regions = new Array<number[]>(rows.length);
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]!;
          regions[i] = row.map(e => e.index());
        }
        break;
      }

      case "Diagonals": {
        // @java Regions.java:229–238
        const diags = graph.diagonals(defaultType);
        regions = new Array<number[]>(diags.length);
        for (let i = 0; i < diags.length; i++) {
          const diag = diags[i]!;
          regions[i] = diag.map(e => e.index());
        }
        break;
      }

      case "Layers": {
        // @java Regions.java:239–248
        const layers = graph.layers(defaultType);
        regions = new Array<number[]>(layers.length);
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i]!;
          regions[i] = layer.map(e => e.index());
        }
        break;
      }

      case "HintRegions": {
        // @java Regions.java:249–267
        const equipment = context.game().equipment();
        if (this._hintRegionName !== null) {
          const vwh = equipment.verticesWithHints();
          if (vwh.length !== 0) return vwh;
          const cwh = equipment.cellsWithHints();
          if (cwh.length !== 0) return cwh;
          const ewh = equipment.edgesWithHints();
          if (ewh.length !== 0) return ewh;
        } else {
          return equipment.cellsWithHints();
        }
        break;
      }

      case "AllDirections": {
        // @java Regions.java:268–292
        // list of cell indices in the chosen directions (radial expansion)
        const elements = graph.getGraphElements(defaultType);
        regions = new Array<number[]>(elements.length);
        for (const element of elements) {
          const traj = (graph as unknown as { trajectories(): { radials(type: SiteType, site: number, dir: string): Array<{ steps(): Array<{ id(): number }> }> } | null }).trajectories?.();
          const locs: number[] = [element.index()];

          if (traj !== null && traj !== undefined) {
            const radials = traj.radials(defaultType, element.index(), "All");
            for (const radial of radials) {
              const steps = radial.steps();
              for (let toIdx = 1; toIdx < steps.length; toIdx++) {
                const to = steps[toIdx]!.id();
                if (!locs.includes(to)) locs.push(to);
              }
            }
          }

          regions[element.index()] = locs;
        }
        break;
      }

      case "SubGrids": {
        // @java Regions.java:293–315
        const allCells = graph.cells();
        const sizeSubGrids = Math.floor(Math.sqrt(Math.sqrt(allCells.length)));
        regions = new Array<number[]>(sizeSubGrids * sizeSubGrids);
        for (let r = 0; r < regions.length; r++) {
          regions[r] = new Array<number>(sizeSubGrids * sizeSubGrids).fill(0);
        }

        let indexRegion = 0;
        for (let rowSubGrid = 0; rowSubGrid < sizeSubGrids; rowSubGrid++) {
          for (let colSubGrid = 0; colSubGrid < sizeSubGrids; colSubGrid++) {
            let indexOnTheRegion = 0;
            for (const vertex of allCells) {
              const col = vertex.col();
              const row = vertex.row();
              if (
                row >= rowSubGrid * sizeSubGrids &&
                row < (rowSubGrid + 1) * sizeSubGrids
              ) {
                if (
                  col >= colSubGrid * sizeSubGrids &&
                  col < (colSubGrid + 1) * sizeSubGrids
                ) {
                  regions[indexRegion]![indexOnTheRegion] = vertex.index();
                  indexOnTheRegion++;
                }
              }
            }
            indexRegion++;
          }
        }
        break;
      }

      case "Regions":
      case "Vertices":
      case "Touching": {
        // @java Regions.java:316–330
        const touchingRegions: [number, number][] = [];
        const graphElements = graph.getGraphElements(defaultType);
        for (const element of graphElements) {
          for (const vElement of element.adjacent()) {
            touchingRegions.push([element.index(), vElement.index()]);
          }
        }
        regions = touchingRegions.map(([a, b]) => [a, b]);
        break;
      }

      default:
        break;
    }

    return regions;
  }

  // ---------------------------------------------------------------------------
  // missingRequirement / concepts
  // ---------------------------------------------------------------------------

  /**
   * @java Regions.missingRequirement(Game)
   */
  public missingRequirement(game: GameLike): boolean {
    let missingRequirement = false;

    if (this._region !== null) {
      for (const r of this._region) {
        const fn = (r as unknown as { missingRequirement?(g: GameLike): boolean }).missingRequirement;
        if (typeof fn === "function") {
          missingRequirement = missingRequirement || fn.call(r, game);
        }
      }
    }

    return missingRequirement;
  }

  /**
   * @java Regions.toString()
   */
  public override toString(): string {
    return "Regions in Equipment named = " + this.name();
  }
}
