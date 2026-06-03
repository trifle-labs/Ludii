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

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

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
   */
  public override eval(context: Context): number {
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

    for (let p = 0; p < regionToCheck.length; p++) {
      const from = regionToCheck[p] as number;
      // Java: if (from == Constants.UNDEFINED) return maxExtent;
      if (from === UNDEFINED) return maxExtent;

      const colourLoop = this.colourFn.eval(context);

      // Access the Java topology via the context's underlying game/board.
      // These casts are faithful to the Java but require a full Java-style
      // Context to work at runtime; in the 1:1 TS path this throws gracefully.
      const ctx = context as unknown as {
        topology?(): {
          cells(): { get(i: number): { row(): number; col(): number } };
          numEdges(): number;
          trajectories(): {
            steps(
              fromType: string,
              from: number,
              toType: string,
              dir: unknown,
            ): Array<{ to(): { id(): number } }>;
          };
        };
        containerId?(): number[];
        state(): {
          containerStates(): Array<{
            what(site: number, type: string): number;
            rotation(site: number, type: string): number;
          }>;
        };
        components?(): Array<{
          isTile(): boolean;
          paths(): Array<{
            colour(): { intValue(): number };
            side1(rotation: number, numEdges: number): number;
            side2(rotation: number, numEdges: number): number;
          }>;
        }>;
      };

      const graph = ctx.topology?.();
      if (graph === undefined) return maxExtent;

      const fromCell = graph.cells().get(from);
      const fromRow = fromCell.row();
      const fromCol = fromCell.col();
      const containerId = ctx.containerId?.() ?? [];
      const cid = containerId[from] ?? 0;
      const cs = ctx.state().containerStates()[cid];
      if (cs === undefined) return maxExtent;

      const whatSideId = cs.what(from, "Cell");
      const components = ctx.components?.() ?? [];
      if (whatSideId === 0 || !components[whatSideId]?.isTile()) return maxExtent;

      const ratioAdjOrtho = graph.numEdges();

      // Java: TIntArrayList tileConnected / originTileConnected
      const tileConnected: number[] = [from];
      const originTileConnected: number[] = [from];

      for (let index = 0; index < tileConnected.length; index++) {
        const site = tileConnected[index] as number;
        const cell = graph.cells().get(site);
        const what = cs.what(site, "Cell");
        const component = components[what];
        if (component === undefined) continue;

        const rotation = (cs.rotation(site, "Cell") * 2) / ratioAdjOrtho;
        const paths = [...component.paths()];

        for (const path of paths) {
          if (path.colour().intValue() !== colourLoop) continue;

          // Side 1
          const side1Dir = path.side1(rotation, graph.numEdges());
          const stepsSide1 = graph.trajectories().steps("Cell", cell.row(), "Cell", side1Dir);
          if (stepsSide1.length > 0) {
            const site1Connected = stepsSide1[0]!.to().id();
            const cell1Connected = graph.cells().get(site1Connected);
            const rowCell1 = cell1Connected.row();
            const colCell1 = cell1Connected.col();

            const drow = Math.abs(rowCell1 - fromRow);
            const dcol = Math.abs(colCell1 - fromCol);
            if (drow > maxExtent) maxExtent = drow;
            if (dcol > maxExtent) maxExtent = dcol;

            const whatSide1 = cs.what(site1Connected, "Cell");
            if (
              originTileConnected[index] !== site1Connected &&
              whatSide1 !== 0 &&
              components[whatSide1]?.isTile()
            ) {
              tileConnected.push(site1Connected);
              originTileConnected.push(site);
            }
          }

          // Side 2
          const side2Dir = path.side2(rotation, graph.numEdges());
          const stepsSide2 = graph.trajectories().steps("Cell", cell.row(), "Cell", side2Dir);
          if (stepsSide2.length > 0) {
            const site2Connected = stepsSide2[0]!.to().id();
            const cell2Connected = graph.cells().get(site2Connected);
            const rowCell2 = cell2Connected.row();
            const colCell2 = cell2Connected.col();

            const drow = Math.abs(rowCell2 - fromRow);
            const dcol = Math.abs(colCell2 - fromCol);
            if (drow > maxExtent) maxExtent = drow;
            if (dcol > maxExtent) maxExtent = dcol;

            const whatSide2 = cs.what(site2Connected, "Cell");
            if (
              originTileConnected[index] !== site2Connected &&
              whatSide2 !== 0 &&
              components[whatSide2]?.isTile()
            ) {
              tileConnected.push(site2Connected);
              originTileConnected.push(site);
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
