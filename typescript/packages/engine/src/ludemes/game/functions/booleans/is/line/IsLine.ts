/**
 * @java game/functions/booleans/is/line/IsLine.java IsLine
 *
 * Tests whether a succession of sites are occupied by a specified piece,
 * forming a line of the given minimum length.
 *
 * For the TTT 1:1 path we implement the common case:
 *   (is Line N)                  — through:=(last To), who:=Mover, dirn:=Adjacent
 *   (is Line N dirn)             — explicit direction
 *   (is Line N dirn exact:True)  — line must be exactly N (not part of longer)
 *
 * Java parity (IsLine.eval simplified for non-stacking, non-puzzle case):
 *   1. pivot = through.eval(context)  [default: LastTo = context.to()]
 *   2. pivotWhat = what(pivot)  — component index at pivot
 *   3. For each distinct radial from pivot in the requested direction:
 *      a. Walk forward ray counting contiguous matching cells
 *      b. Walk opposite ray extending the count
 *      c. If exact: count === len; else count >= len → return true
 *   4. Return false
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { CellFlatRadials, FlatRadial } from "../../../../../topology-radials.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

export class IsLine implements BooleanFunction {
  /** Minimum line length. @java IsLine.length */
  private readonly lengthFn: IntFunction;
  /** Direction name string, e.g. "Adjacent". @java IsLine.dirn */
  private readonly dirnName: string;
  /**
   * When true, the line must be exactly `len` long — not part of a longer line.
   * @java IsLine.exactLength
   */
  private readonly exact: boolean;

  /**
   * @java game/functions/booleans/is/line/IsLine.java — faithful 16-param constructor:
   * (SiteType type, IntFunction length, AbsoluteDirection dirn, @Or IntFunction through,
   *  @Or RegionFunction throughAny, @Or2 RoleType who, @Or2 IntFunction what,
   *  @Or2 IntFunction[] whats, BooleanFunction exact, BooleanFunction contiguous,
   *  BooleanFunction If, BooleanFunction byLevel, BooleanFunction top,
   *  IntFunction throughHowMuch, BooleanFunction isVisible, BooleanFunction useOpposites).
   * Only `length` is required in Java; the rest are @Opt. The 1:1 eval currently uses
   * length, dirn and exact; the remaining params are accepted faithfully (stored/ignored).
   * Enum params (SiteType/AbsoluteDirection/RoleType) are represented by their name strings.
   */
  public constructor(
    _type: string | null,
    length: IntFunction,
    dirn: string | null = null,
    _through: IntFunction | null = null,
    _throughAny: RegionFunction | null = null,
    _who: string | null = null,
    _what: IntFunction | null = null,
    _whats: readonly IntFunction[] | null = null,
    exact: BooleanFunction | boolean | null = null,
    _contiguous: BooleanFunction | null = null,
    _If: BooleanFunction | null = null,
    _byLevel: BooleanFunction | null = null,
    _top: BooleanFunction | null = null,
    _throughHowMuch: IntFunction | null = null,
    _isVisible: BooleanFunction | null = null,
    _useOpposites: BooleanFunction | null = null,
  ) {
    this.lengthFn = length;
    this.dirnName = dirn ?? "Adjacent";
    this.exact = typeof exact === "boolean" ? exact : false;
  }

  /**
   * @java game/functions/booleans/is/line/IsLine.java — eval(Context)
   *
   * Pivot = context._evalTo (Java: context.to()), which the play loop sets
   * to the last-placed site before calling end-rule eval.
   */
  public eval(ctx: Context): boolean {
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

    const matchFn = (site: number): boolean => {
      const w = ((whats[site] ?? 0) !== 0) ? (whats[site] as number) : (cells[site] ?? 0);
      return w === pivotWhat;
    };

    /**
     * Test whether `count` satisfies the length condition.
     * exact=false: count >= len
     * exact=true:  count === len (not part of a longer line)
     * @java IsLine.eval — exactLength branch
     */
    const matchesLen = (count: number): boolean =>
      this.exact ? count === len : count >= len;

    // For graph-based boards (hex/tri/concentric/etc.), use the Trajectories
    // object to get direction-correct distinct radials via distinctRadialsByName.
    // @java other/topology/Topology.java — preGenerateDirection(game)
    // @java game/util/graph/Radials.java — distinctInDirection(dirn)
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null; _radials?: CellFlatRadials[] };
    const traj: Trajectories | null | undefined = ctxAny._trajectories;

    if (traj != null) {
      // Graph path: use Trajectories.distinctRadialsByName which is direction-aware.
      const distinctRadials = traj.distinctRadialsByName(pivot, this.dirnName);
      for (const { ray, opposites } of distinctRadials) {
        let count = 1; // pivot itself
        for (let i = 1; i < ray.length; i++) {
          const s = ray[i];
          if (s === undefined || !matchFn(s)) break;
          count++;
        }
        const opp = opposites[0] ?? [];
        for (let i = 1; i < opp.length; i++) {
          const s = opp[i];
          if (s === undefined || !matchFn(s)) break;
          count++;
        }
        if (matchesLen(count)) return true;
      }
      return false;
    }

    // Square/rectangle path: use precomputed flat radials table.
    const radials = ctxAny._radials;
    if (radials === undefined) {
      throw new Error("IsLine(1:1): _radials not attached to context. Board1to1 must set ctx._radials.");
    }

    const cellRadials = radials[pivot];
    if (cellRadials === undefined) return false;

    const selectedAxes = selectAxes(cellRadials.axes, this.dirnName);

    // Java IsLine.eval lines 333-519: for each distinct radial, walk forward
    // then opposite, return true if count satisfies len condition.
    for (const { ray, opposite } of selectedAxes) {
      if (!ray || !opposite) continue; // guard against sparse axis arrays
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

      if (matchesLen(count)) return true;
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
