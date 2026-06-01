/**
 * @java game/functions/booleans/is/line/IsLine.java IsLine
 *
 * Tests whether a succession of sites are occupied by a specified piece,
 * forming a line of the given minimum length.
 *
 * For the TTT 1:1 path we implement the common case:
 *   (is Line N)         — through:=(last To), who:=Mover, dirn:=Adjacent
 *   (is Line N dirn)    — explicit direction
 *
 * Java parity (IsLine.eval simplified for non-stacking, non-puzzle case):
 *   1. pivot = through.eval(context)  [default: LastTo = context.to()]
 *   2. pivotWhat = what(pivot)  — component index at pivot
 *   3. For each distinct radial from pivot in the requested direction:
 *      a. Walk forward ray counting contiguous matching cells
 *      b. Walk opposite ray extending the count
 *      c. If count >= len (non-exact), return true
 *   4. Return false
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { CellFlatRadials, FlatRadial } from "../../../../../topology-radials.js";

export class IsLine implements BooleanFunction {
  /** Minimum line length. @java IsLine.length */
  private readonly lengthFn: IntFunction;
  /** Direction name string, e.g. "Adjacent". @java IsLine.dirn */
  private readonly dirnName: string;

  /**
   * @java game/functions/booleans/is/line/IsLine.java — constructor
   */
  public constructor(length: IntFunction, dirnName = "Adjacent") {
    this.lengthFn = length;
    this.dirnName = dirnName;
  }

  /**
   * @java game/functions/booleans/is/line/IsLine.java — eval(Context)
   *
   * Pivot = context._evalTo (Java: context.to()), which the play loop sets
   * to the last-placed site before calling end-rule eval.
   */
  public eval(ctx: Context): boolean {
    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (radials === undefined) {
      throw new Error("IsLine(1:1): _radials not attached to context. Board1to1 must set ctx._radials.");
    }

    const pivot = ctx._evalTo;
    if (pivot < 0) return false;

    const state = ctx.state;
    const cells = state.cells;
    if (pivot >= cells.length) return false;

    // Matching component: use whats[pivot] if set, else cells[pivot] (owner).
    // @java IsLine.eval line 298: whats = { what(locn, type) }
    const whats = state.whats;
    const pivotWhat: number =
      ((whats[pivot] ?? 0) !== 0) ? (whats[pivot] as number) : (cells[pivot] ?? 0);
    if (pivotWhat === 0) return false;

    const len = this.lengthFn.eval(ctx);

    const cellRadials = radials[pivot];
    if (cellRadials === undefined) return false;

    const selectedAxes = selectAxes(cellRadials.axes, this.dirnName);

    const matchFn = (site: number): boolean => {
      const w = ((whats[site] ?? 0) !== 0) ? (whats[site] as number) : (cells[site] ?? 0);
      return w === pivotWhat;
    };

    // Java IsLine.eval lines 333-519: for each distinct radial, walk forward
    // then opposite, return true if count >= len.
    for (const { ray, opposite } of selectedAxes) {
      let count = 1; // pivot itself

      for (let i = 1; i < ray.length; i++) {
        const s = ray[i];
        if (s === undefined || !matchFn(s)) break;
        count++;
      }
      for (let i = 1; i < opposite.length; i++) {
        const s = opposite[i];
        if (s === undefined || !matchFn(s)) break;
        count++;
      }

      if (count >= len) return true;
    }

    return false;
  }
}

/**
 * Select relevant axis radials by direction name.
 * @java game/util/graph/Radials.java — distinctInDirection()
 */
function selectAxes(
  axes: readonly FlatRadial[],
  dirName: string,
): readonly FlatRadial[] {
  const upper = dirName.toUpperCase();
  switch (upper) {
    case "ADJACENT": case "ALL":
      return axes;
    case "ORTHOGONAL":
      return [axes[0]!, axes[1]!];
    case "DIAGONAL":
      return [axes[2]!, axes[3]!];
    case "E": case "EAST":
      return [axes[0]!];
    case "W": case "WEST":
      return [{ ray: axes[0]!.opposite, opposite: axes[0]!.ray }];
    case "N": case "NORTH":
      return [axes[1]!];
    case "S": case "SOUTH":
      return [{ ray: axes[1]!.opposite, opposite: axes[1]!.ray }];
    case "NE": case "NORTHEAST":
      return [axes[2]!];
    case "SW": case "SOUTHWEST":
      return [{ ray: axes[2]!.opposite, opposite: axes[2]!.ray }];
    case "NW": case "NORTHWEST":
      return [axes[3]!];
    case "SE": case "SOUTHEAST":
      return [{ ray: axes[3]!.opposite, opposite: axes[3]!.ray }];
    default:
      return axes;
  }
}
