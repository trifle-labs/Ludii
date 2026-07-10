// @java Core/src/game/functions/ints/tile/PathExtent.java

/**
 * Returns the maximum extent of a path.
 *
 * The path extent is the maximum board width and/or height that the path
 * extends to. Used in tile-based games with paths, such as Trax.
 *
 * @java game/functions/ints/tile/PathExtent.java
 * @author Eric.Piette and cambolbro
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { applyRotationToFacing } from "../../../util/directions/RelativeDirection.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * @java game/util/directions/CompassDirection — facing units (45°, N=0 … NW=7).
 * PathExtent resolves a tile path's side index to an absolute compass heading
 * exactly like Java's Directions(Forward, Orthogonal).convertToAbsolute with an
 * explicit rotation: the default facing is North (Trax tiles declare no dirn),
 * FR-rotated `sideIndex` steps over the cell's supported orthogonal ring, and
 * the Forward relative direction is the resulting facing itself.
 */
const COMPASS8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/**
 * Thin interface for the Java `RegionFunction` contract used by PathExtent's
 * regionStartFn (SitesLastTo — returns an array of start sites).
 */
interface JavaRegionFunction {
  eval(context: Context): { sites(): number[] } | number[];
}

/**
 * Returns the maximum extent of a path.
 *
 * Walks the tile-path graph starting from one or more seed sites, following
 * colour-matched path segments, and returns the largest absolute row/column
 * distance from the starting cell.
 *
 * @java game/functions/ints/tile/PathExtent.java
 */
export class PathExtent extends BaseIntFunction {
  /** @java PathExtent.colourFn — the colour (player index) of the path */
  private readonly colourFn: JavaIntFunction;

  /** @java PathExtent.startFn — the starting site of the path (default: lastTo) */
  private readonly startFn: JavaIntFunction;

  /**
   * @java PathExtent.regionStartFn — the starting sites (default: SitesLastTo).
   * When non-null, regionStartFn takes priority over startFn.
   */
  private readonly regionStartFn: RegionFunction | null;

  /**
   * @param colour      The colour of the path (null → mover).
   * @param start       The starting point of the path (null → lastTo).
   * @param regionStart The starting points of the path (null → SitesLastTo, unless start is provided).
   *
   * @java PathExtent(IntFunction, IntFunction, RegionFunction)
   */
  public constructor(
    colour: JavaIntFunction | null,
    start: JavaIntFunction | null,
    regionStart: RegionFunction | null,
  ) {
    super();

    // Java: if (numNonNull > 1) throw IllegalArgumentException
    const numNonNull = (start !== null ? 1 : 0) + (regionStart !== null ? 1 : 0);
    if (numNonNull > 1) {
      throw new Error("PathExtent: Zero or one Or parameter can be non-null.");
    }

    // Java: this.colourFn = (colour == null) ? new Mover() : colour;
    this.colourFn = colour ?? {
      eval: (ctx: Context) => ctx.state.mover,
      exceeds: (ctx: Context, other: JavaIntFunction) => ctx.state.mover > other.eval(ctx),
      isHint: () => false,
      isHand: () => false,
      concepts: (_g: unknown) => new Set<number>(),
      readsEvalContextRecursive: () => new Set<number>(),
      writesEvalContextRecursive: () => new Set<number>(),
      missingRequirement: (_g: unknown) => false,
      willCrash: (_g: unknown) => false,
      toEnglish: (_g: unknown) => "mover",
    };

    // Java: this.startFn = (start == null) ? new LastTo(null) : start;
    this.startFn = start ?? {
      eval: (ctx: Context) => {
        // Java: new LastTo(null).eval(context) → context.trial().lastMove().getTo()
        const lastMove = (ctx.trial as unknown as { lastMove?(): unknown }).lastMove?.();
        if (lastMove === undefined || lastMove === null) return UNDEFINED;
        return (lastMove as unknown as { to?(): number }).to?.() ?? UNDEFINED;
      },
      exceeds: (ctx: Context, other: JavaIntFunction) => {
        const lastMove = (ctx.trial as unknown as { lastMove?(): unknown }).lastMove?.();
        const v = lastMove === undefined || lastMove === null ? UNDEFINED
          : (lastMove as unknown as { to?(): number }).to?.() ?? UNDEFINED;
        return v > other.eval(ctx);
      },
      isHint: () => false,
      isHand: () => false,
      concepts: (_g: unknown) => new Set<number>(),
      readsEvalContextRecursive: () => new Set<number>(),
      writesEvalContextRecursive: () => new Set<number>(),
      missingRequirement: (_g: unknown) => false,
      willCrash: (_g: unknown) => false,
      toEnglish: (_g: unknown) => "lastTo",
    };

    // Java: this.regionStartFn = (regionStart == null)
    //   ? ((start == null) ? new SitesLastTo() : null)
    //   : regionStart;
    if (regionStart !== null) {
      this.regionStartFn = regionStart;
    } else if (start === null) {
      // Default: SitesLastTo — wraps lastTo as a one-element region
      this.regionStartFn = {
        eval: (ctx: Context) => {
          const lastMove = (ctx.trial as unknown as { lastMove?(): unknown }).lastMove?.();
          if (lastMove === undefined || lastMove === null) return [];
          const s = (lastMove as unknown as { to?(): number }).to?.() ?? UNDEFINED;
          return s >= 0 ? [s] : [];
        },
      } as RegionFunction;
    } else {
      this.regionStartFn = null;
    }
  }

  /**
   * @java PathExtent.eval(Context)
   *
   * Walks the tile-path graph from each start site, following path segments
   * that match the requested colour. Returns the maximum row or column
   * distance from the origin start cell encountered during the walk.
   *
   * Uses the real TS Context API (ctx.topology()/ctx.containerState()/
   * ctx.components()) exactly as the sibling tile ludeme IsSidesMatch does —
   * the earlier port called a Java-shaped `ctx.state().containerStates()` that
   * does not exist in TS and hard-crashed apply() (Trax, ply 1).
   */
  public override eval(context: Context): number {
    const ctx = context as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => {
        what: (site: number) => number;
        rotation: (site: number) => number;
      };
      components?: () => Array<{ isTile?: () => boolean; paths?: () => Array<{
        side1Rotated: (rotation: number, numEdges: number) => number;
        side2Rotated: (rotation: number, numEdges: number) => number;
        colour: () => number;
      }> | null }>;
      topology?: () => {
        cells: () => Array<{
          row: () => number;
          col: () => number;
          index: () => number;
          supportedOrthogonalDirections?: () => Array<{ toAbsolute?: () => string }>;
        }>;
        numEdges: () => number;
        trajectories: () => {
          steps: (fromType: string, from: number, toType: string, dir: string) => Array<{ to: () => { id: () => number } }>;
        };
      };
    };

    // Java: final int[] regionToCheck;
    let regionToCheck: number[];
    if (this.regionStartFn !== null) {
      // Java: final Region region = regionStartFn.eval(context); regionToCheck = region.sites();
      const regionResult = this.regionStartFn.eval(context as never);
      regionToCheck = Array.isArray(regionResult)
        ? (regionResult as number[])
        : ((regionResult as unknown as { sites(): number[] }).sites?.() ?? []);
    } else {
      // Java: regionToCheck = new int[1]; regionToCheck[0] = startFn.eval(context);
      regionToCheck = [this.startFn.eval(context)];
    }

    let maxExtent = 0;

    const topology = typeof ctx.topology === "function" ? ctx.topology() : null;
    if (!topology) return maxExtent;
    const cells = typeof topology.cells === "function" ? topology.cells() : [];
    // Java: ratioAdjOrtho = context.topology().numEdges() (regular per-cell edge
    // count, e.g. 4 for a square tile). Also the modulus for side1/side2 rotation.
    const numEdges = typeof topology.numEdges === "function" ? topology.numEdges() : 0;
    const ratioAdjOrtho = numEdges;
    const traj = typeof topology.trajectories === "function" ? topology.trajectories() : null;
    const components = typeof ctx.components === "function" ? ctx.components() : [];
    const containerIdArr = typeof ctx.containerId === "function" ? ctx.containerId() : null;

    for (let p = 0; p < regionToCheck.length; p++) {
      const from = regionToCheck[p] as number;
      // Java: if (from == Constants.UNDEFINED) return maxExtent;
      if (from === UNDEFINED) return maxExtent;

      const colourLoop = this.colourFn.eval(context);
      const fromCell = cells[from];
      if (!fromCell) return maxExtent;
      const fromRow = fromCell.row();
      const fromCol = fromCell.col();

      const cid = (containerIdArr && containerIdArr.length > from) ? (containerIdArr[from] ?? 0) : 0;
      const cs = typeof ctx.containerState === "function" ? ctx.containerState(cid) : null;
      if (!cs) return maxExtent;

      // Java: whatSideId = cs.what(from, Cell); if (0 || !isTile) return maxExtent;
      const whatSideId = cs.what(from);
      if (whatSideId === 0 || !components[whatSideId]?.isTile?.()) return maxExtent;

      // Java: TIntArrayList tileConnected / originTileConnected
      const tileConnected: number[] = [from];
      const originTileConnected: number[] = [from];

      for (let index = 0; index < tileConnected.length; index++) {
        const site = tileConnected[index] as number;
        const cell = cells[site];
        if (!cell) continue;
        const what = cs.what(site);
        const component = components[what];
        if (component === undefined || !component.isTile?.()) continue;

        // Java: rotation = (cs.rotation(site, Cell) * 2) / ratioAdjOrtho (int div)
        const rotation = Math.trunc((cs.rotation(site) * 2) / (ratioAdjOrtho || 1));
        const paths = component.paths?.() ?? [];
        const orthoDirs = typeof cell.supportedOrthogonalDirections === "function"
          ? cell.supportedOrthogonalDirections()
          : [];
        const orthoNames = orthoDirs.map(d => (typeof d?.toAbsolute === "function" ? d.toAbsolute() : String(d)));

        for (const path of paths) {
          // Java: path.colour().intValue() == colourLoop
          if (path.colour() !== colourLoop) continue;

          // Side 1 — Java: convertToAbsolute(Cell, cell, null, null, side1(rotation, numEdges))
          const side1Idx = path.side1Rotated(rotation, numEdges);
          const dir1 = COMPASS8[applyRotationToFacing(0, side1Idx, orthoNames) % 8] ?? "N";
          const stepsSide1 = traj ? traj.steps("Cell", cell.index(), "Cell", dir1) : [];
          if (stepsSide1.length > 0) {
            const site1Connected = stepsSide1[0]!.to().id();
            const cell1Connected = cells[site1Connected];
            if (cell1Connected) {
              const drow = Math.abs(cell1Connected.row() - fromRow);
              const dcol = Math.abs(cell1Connected.col() - fromCol);
              if (drow > maxExtent) maxExtent = drow;
              if (dcol > maxExtent) maxExtent = dcol;

              const whatSide1 = cs.what(site1Connected);
              if (
                originTileConnected[index] !== site1Connected &&
                whatSide1 !== 0 &&
                components[whatSide1]?.isTile?.()
              ) {
                tileConnected.push(site1Connected);
                originTileConnected.push(site);
              }
            }
          }

          // Side 2 — Java: convertToAbsolute(Cell, cell, null, null, side2(rotation, numEdges))
          const side2Idx = path.side2Rotated(rotation, numEdges);
          const dir2 = COMPASS8[applyRotationToFacing(0, side2Idx, orthoNames) % 8] ?? "N";
          const stepsSide2 = traj ? traj.steps("Cell", cell.index(), "Cell", dir2) : [];
          if (stepsSide2.length > 0) {
            const site2Connected = stepsSide2[0]!.to().id();
            const cell2Connected = cells[site2Connected];
            if (cell2Connected) {
              const drow = Math.abs(cell2Connected.row() - fromRow);
              const dcol = Math.abs(cell2Connected.col() - fromCol);
              if (drow > maxExtent) maxExtent = drow;
              if (dcol > maxExtent) maxExtent = dcol;

              const whatSide2 = cs.what(site2Connected);
              if (
                originTileConnected[index] !== site2Connected &&
                whatSide2 !== 0 &&
                components[whatSide2]?.isTile?.()
              ) {
                tileConnected.push(site2Connected);
                originTileConnected.push(site);
              }
            }
          }
        }
      }
    }

    return maxExtent;
  }

  //-------------------------------------------------------------------------

  /** @java PathExtent.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java PathExtent.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    const concepts = new Set<number>();
    const colourConcepts = this.colourFn.concepts(_game);
    colourConcepts.forEach(c => concepts.add(c));
    const startConcepts = this.startFn.concepts(_game);
    startConcepts.forEach(c => concepts.add(c));
    // Java: concepts.set(Concept.PathExtent.id(), true);
    // PathExtent concept id — not critical for coverage port
    if (this.regionStartFn !== null) {
      // regionStartFn.concepts(game) would be merged here when wired
    }
    return concepts;
  }

  /** @java PathExtent.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    const cw = this.colourFn.writesEvalContextRecursive();
    cw.forEach(v => writeEvalContext.add(v));
    const sw = this.startFn.writesEvalContextRecursive();
    sw.forEach(v => writeEvalContext.add(v));
    if (this.regionStartFn !== null) {
      // regionStartFn.writesEvalContextRecursive() merged when wired
    }
    return writeEvalContext;
  }

  /** @java PathExtent.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return new Set();
  }

  /** @java PathExtent.preprocess(Game) */
  public preprocess(_game: unknown): void {
    (this.colourFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(_game);
    (this.startFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(_game);
    if (this.regionStartFn !== null) {
      (this.regionStartFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(_game);
    }
  }

  /** @java PathExtent.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;

    // Java: check that at least one component is a tile
    const g = game as unknown as {
      equipment?(): { components(): Array<{ isTile(): boolean } | null | undefined> };
      addRequirementToReport?(s: string): void;
    };
    const comps = g.equipment?.().components() ?? [];
    let gameHasTile = false;
    for (let i = 1; i < comps.length; i++) {
      if (comps[i]?.isTile()) {
        gameHasTile = true;
        break;
      }
    }
    if (!gameHasTile) {
      g.addRequirementToReport?.(
        "The ludeme (pathExtent ...) is used but the equipment has no tiles.",
      );
      missingRequirement = true;
    }

    missingRequirement = missingRequirement || this.colourFn.missingRequirement(game);
    missingRequirement = missingRequirement || this.startFn.missingRequirement(game);

    if (this.regionStartFn !== null) {
      missingRequirement = missingRequirement ||
        ((this.regionStartFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }

    return missingRequirement;
  }

  /** @java PathExtent.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.colourFn.willCrash(game);
    willCrash = willCrash || this.startFn.willCrash(game);
    if (this.regionStartFn !== null) {
      willCrash = willCrash ||
        ((this.regionStartFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }
}
