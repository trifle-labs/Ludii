// @java Core/src/game/functions/booleans/is/integer/IsSidesMatch.java

/**
 * Is used to detect whether the terminus of a tile matches with its neighbours.
 *
 * @java game/functions/booleans/is/integer/IsSidesMatch.java
 * @author Eric.Piette
 * @remarks Used to detect whether the terminus of a tile matches with its neighbours.
 *          If no tile is on the location the function returns true.
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction } from "../../../../../base.js";
import { LastTo } from "../../../ints/last/LastTo.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Is used to detect whether the terminus of a tile matches with its neighbours.
 *
 * @java game/functions/booleans/is/integer/IsSidesMatch.java
 */
export class IsSidesMatch extends BaseBooleanFunction {
  /** @java IsSidesMatch.toFn — the position of the tile to check */
  private readonly toFn: IntFunction;

  /**
   * @param to The location of the tile [(lastTo)].
   * @java IsSidesMatch(IntFunction)
   */
  public constructor(to?: IntFunction | null) {
    super();
    this.toFn = (to !== undefined && to !== null) ? to : new LastTo(undefined);
  }

  /**
   * @java IsSidesMatch.eval(Context)
   *
   * Checks if the terminus of the tile at the given position matches its orthogonal neighbours.
   */
  public override eval(context: Context): boolean {
    const to = this.toFn.eval(context);

    if (to === UNDEFINED) {
      return false;
    }

    // Java: final int cid = context.containerId()[to];
    const ctx = context as unknown as {
      containerId?: () => number[];
      containers?: () => Array<{ topology?: () => unknown }>;
      containerState?: (cid: number) => {
        whatCell?: (idx: number) => number;
        what?: (idx: number, type: string) => number;
        rotation?: (idx: number, type: string) => number;
        isResolvedEdges?: (idx: number) => boolean;
      };
      components?: () => Array<{
        isTile?: () => boolean;
        terminus?: () => number[] | null;
        numTerminus?: () => number | null;
        paths?: () => Array<{
          side1?: () => number;
          terminus1?: () => number;
          side2?: () => number;
          terminus2?: () => number;
          colour?: () => number;
        }>;
        owner?: () => number;
      }>;
      topology?: () => {
        cells?: () => Array<{
          index?: () => number;
          orthogonal?: () => Array<{ index?: () => number }>;
        }>;
        supportedAdjacentDirections?: (type: string) => unknown[];
        supportedOrthogonalDirections?: (type: string) => Array<{
          toAbsolute?: () => string;
        }>;
        numEdges?: () => number;
        trajectories?: () => {
          steps?: (
            type: string,
            fromIdx: number,
            toType: string,
            dir: string,
          ) => Array<{ to?: () => { id?: () => number } }>;
        };
      };
    };

    const containerIdArr = typeof ctx.containerId === "function" ? ctx.containerId() : null;
    const cid = (containerIdArr && containerIdArr.length > to) ? (containerIdArr[to] ?? 0) : 0;

    const topology = typeof ctx.topology === "function" ? ctx.topology() : null;
    if (!topology) return true;

    const adjDirs = typeof topology.supportedAdjacentDirections === "function"
      ? topology.supportedAdjacentDirections("Cell")
      : [];
    const orthoDirs = typeof topology.supportedOrthogonalDirections === "function"
      ? topology.supportedOrthogonalDirections("Cell")
      : [];

    const ratioAdjOrtho = orthoDirs.length > 0
      ? Math.floor(adjDirs.length / orthoDirs.length)
      : 1;

    const cs = typeof ctx.containerState === "function" ? ctx.containerState(cid) : null;
    if (!cs) return true;

    const what = typeof cs.whatCell === "function"
      ? cs.whatCell(to)
      : (typeof cs.what === "function" ? cs.what(to, "Cell") : 0);

    if (what === 0) {
      return false;
    }

    const components = typeof ctx.components === "function" ? ctx.components() : null;
    if (!components || what < 0 || what >= components.length) return true;
    const component = components[what];
    if (!component) return true;

    if (typeof component.isTile !== "function" || !component.isTile()) {
      return true;
    }

    const numberEdges = typeof topology.numEdges === "function" ? topology.numEdges() : 0;
    // @java IsSidesMatch.java:132 — int/int division TRUNCATES; the float
    // quotient produced fractional rotation indices when ratio > 1.
    let rotation = Math.trunc((typeof cs.rotation === "function" ? cs.rotation(to, "Cell") : 0) / ratioAdjOrtho);

    let terminus: number[] = typeof component.terminus === "function"
      ? (component.terminus() ?? [])
      : [];
    const numTerminus = typeof component.numTerminus === "function" ? component.numTerminus() : null;
    const paths = typeof component.paths === "function" ? component.paths() : [];

    if (numTerminus !== null && numTerminus !== undefined) {
      terminus = new Array(numberEdges).fill(numTerminus as number);
    }

    // Java: int[][] coloredTerminus = new int[numberEdges][];
    const coloredTerminus: number[][] = [];
    for (let i = 0; i < numberEdges; i++) {
      const t = terminus[i] ?? 0;
      coloredTerminus.push(new Array(t).fill(0));
    }

    // Java: for (final Path path : paths) { ... coloredTerminus[side1][terminus1] = colour; ... }
    for (const path of paths) {
      const side1 = typeof path.side1 === "function" ? path.side1() : 0;
      const t1 = typeof path.terminus1 === "function" ? path.terminus1() : 0;
      const side2 = typeof path.side2 === "function" ? path.side2() : 0;
      const t2 = typeof path.terminus2 === "function" ? path.terminus2() : 0;
      const colour = typeof path.colour === "function" ? path.colour() : 0;
      if (coloredTerminus[side1]) coloredTerminus[side1]![t1] = colour;
      if (coloredTerminus[side2]) coloredTerminus[side2]![t2] = colour;
    }

    // Java: while (rotation != 0) { rotate coloredTerminus; rotation--; }
    while (rotation !== 0) {
      for (let i = 0; i < numberEdges - 1; i++) {
        const temp = coloredTerminus[i + 1]!;
        coloredTerminus[i + 1] = coloredTerminus[0]!;
        coloredTerminus[0] = temp;
      }
      rotation--;
    }

    const cells = typeof topology.cells === "function" ? topology.cells() : null;
    if (!cells || to < 0 || to >= cells.length) return true;
    const toCell = cells[to];
    if (!toCell) return true;

    const orthogonalCells = typeof toCell.orthogonal === "function" ? toCell.orthogonal() : [];

    for (const vOrtho of orthogonalCells) {
      const vOrthoIdx = typeof vOrtho.index === "function" ? vOrtho.index() : -1;
      if (vOrthoIdx < 0) continue;

      const whatOrtho = typeof cs.what === "function"
        ? cs.what(vOrthoIdx, "Cell")
        : (typeof cs.whatCell === "function" ? cs.whatCell(vOrthoIdx) : 0);
      if (whatOrtho === 0) continue;

      if (whatOrtho < 0 || whatOrtho >= components.length) continue;
      const compOrtho = components[whatOrtho];
      if (!compOrtho) continue;
      if (typeof compOrtho.isTile !== "function" || !compOrtho.isTile()) continue;

      // @java IsSidesMatch.java:193 — int/int truncation, as above.
      let rotationOrtho = Math.trunc((typeof cs.rotation === "function" ? cs.rotation(vOrthoIdx, "Cell") : 0) / ratioAdjOrtho);
      let terminusOrtho: number[] = typeof compOrtho.terminus === "function"
        ? (compOrtho.terminus() ?? [])
        : [];
      const numTerminusOrtho = typeof compOrtho.numTerminus === "function" ? compOrtho.numTerminus() : null;
      const pathsOrtho = typeof compOrtho.paths === "function" ? compOrtho.paths() : [];

      if (numTerminusOrtho !== null && numTerminusOrtho !== undefined) {
        terminusOrtho = new Array(numberEdges).fill(numTerminusOrtho as number);
      }

      const coloredTerminusOrtho: number[][] = [];
      for (let i = 0; i < numberEdges; i++) {
        const t = terminusOrtho[i] ?? 0;
        coloredTerminusOrtho.push(new Array(t).fill(0));
      }

      for (const path of pathsOrtho) {
        const side1 = typeof path.side1 === "function" ? path.side1() : 0;
        const t1 = typeof path.terminus1 === "function" ? path.terminus1() : 0;
        const side2 = typeof path.side2 === "function" ? path.side2() : 0;
        const t2 = typeof path.terminus2 === "function" ? path.terminus2() : 0;
        const colour = typeof path.colour === "function" ? path.colour() : 0;
        if (coloredTerminusOrtho[side1]) coloredTerminusOrtho[side1]![t1] = colour;
        if (coloredTerminusOrtho[side2]) coloredTerminusOrtho[side2]![t2] = colour;
      }

      while (rotationOrtho !== 0) {
        for (let i = 0; i < numberEdges - 1; i++) {
          const temp = coloredTerminusOrtho[i + 1]!;
          coloredTerminusOrtho[i + 1] = coloredTerminusOrtho[0]!;
          coloredTerminusOrtho[0] = temp;
        }
        rotationOrtho--;
      }

      // Java: find indexSideTile — the orthogonal direction from toCell to vOrtho
      let indexSideTile = 0;
      const trajectories = typeof topology.trajectories === "function" ? topology.trajectories() : null;
      if (trajectories && typeof trajectories.steps === "function") {
        const toCellIdx = typeof toCell.index === "function" ? toCell.index() : to;
        for (; indexSideTile < orthoDirs.length; indexSideTile++) {
          const direction = orthoDirs[indexSideTile];
          if (!direction) continue;
          const absDir = typeof direction.toAbsolute === "function"
            ? direction.toAbsolute()
            : String(direction);
          const steps = trajectories.steps("Cell", toCellIdx, "Cell", absDir);
          let found = false;
          for (const step of steps) {
            const stepToObj2 = typeof step.to === "function" ? step.to() : null;
            const stepId = stepToObj2 !== null
              ? (typeof (stepToObj2 as unknown as { id?: () => number }).id === "function"
                ? (stepToObj2 as unknown as { id: () => number }).id()
                : -1)
              : -1;
            if (stepId === vOrthoIdx) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      const toColor = coloredTerminus[indexSideTile];
      const indexSideOrthoTile = (indexSideTile + Math.floor(numberEdges / 2)) % numberEdges;
      const orthoColor = coloredTerminusOrtho[indexSideOrthoTile];

      if (!toColor || !orthoColor) continue;

      // Java: for (int i = 0; i < toColor.length; i++) if (toColor[i] != orthoColor[orthoColor.length - (1+i)]) return false;
      for (let i = 0; i < toColor.length; i++) {
        const tc = toColor[i] ?? 0;
        const oc = orthoColor[orthoColor.length - (1 + i)] ?? 0;
        if (tc !== oc) {
          return false;
        }
      }
    }

    return true;
  }

  /** @java IsSidesMatch.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsSidesMatch.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    return (this.toFn as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
  }

  /** @java IsSidesMatch.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    return (this.toFn as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game) ?? new Set<number>();
  }

  /** @java IsSidesMatch.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    const tw = (this.toFn as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (tw) for (const v of tw) ws.add(v);
    return ws;
  }

  /** @java IsSidesMatch.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const tr = (this.toFn as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (tr) for (const v of tr) rs.add(v);
    return rs;
  }

  /** @java IsSidesMatch.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.toFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  /** @java IsSidesMatch.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;

    // Java: check if game has tiles
    const g = game as unknown as {
      equipment?: () => { components?: () => Array<{ isTile?: () => boolean }> };
      addRequirementToReport?: (s: string) => void;
    };
    let gameHasTile = false;
    if (typeof g.equipment === "function") {
      const eq = g.equipment();
      const comps = typeof eq.components === "function" ? eq.components() : null;
      if (comps) {
        for (let i = 1; i < comps.length; i++) {
          if (typeof comps[i]?.isTile === "function" && comps[i]!.isTile!()) {
            gameHasTile = true;
            break;
          }
        }
      }
    }

    if (!gameHasTile) {
      if (typeof g.addRequirementToReport === "function") {
        g.addRequirementToReport(
          "The ludeme (is SidesMatch ...) is used but the equipment has no tiles.",
        );
      }
      missingRequirement = true;
    }

    missingRequirement = missingRequirement || ((this.toFn as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return missingRequirement;
  }

  /** @java IsSidesMatch.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return (this.toFn as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false;
  }
}
