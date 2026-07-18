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
import { LastTo } from "../../../ints/last/LastTo.js";
import type { CellFlatRadials, FlatRadial } from "../../../../../topology-radials.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

export class IsLine implements BooleanFunction {
  /** Minimum line length. @java IsLine.length */
  private readonly lengthFn: IntFunction;
  /** Direction name string, e.g. "Adjacent". @java IsLine.dirn */
  private readonly dirnName: string;
  /** @java IsLine.through; default LastTo. */
  private readonly throughFn: IntFunction | null;
  /** @java IsLine.throughAny. */
  private readonly throughAnyFn: RegionFunction | null;
  /** @java IsLine.whoFn, represented as a RoleType name. */
  private readonly who: string | null;
  /** @java IsLine.whatFn. */
  private readonly whatFns: readonly IntFunction[] | null;
  /** @java IsLine.exactly. */
  private readonly exactFn: BooleanFunction;
  /** @java IsLine.contiguousFn. */
  private readonly contiguousFn: BooleanFunction;
  /** @java IsLine.condition. */
  private readonly conditionFn: BooleanFunction;
  /** @java IsLine.byLevelFn. */
  private readonly byLevelFn: BooleanFunction;
  /** @java IsLine.topFn. */
  private readonly topFn: BooleanFunction;
  /** @java IsLine.throughHowMuch. */
  private readonly throughHowMuchFn: IntFunction | null;
  /** @java IsLine.useOppositesFn. */
  private readonly useOppositesFn: BooleanFunction;

  /**
   * @java game/functions/booleans/is/line/IsLine.java — faithful 16-param constructor:
   * (SiteType type, IntFunction length, AbsoluteDirection dirn, @Or IntFunction through,
   *  @Or RegionFunction throughAny, @Or2 RoleType who, @Or2 IntFunction what,
   *  @Or2 IntFunction[] whats, BooleanFunction exact, BooleanFunction contiguous,
   *  BooleanFunction If, BooleanFunction byLevel, BooleanFunction top,
   *  IntFunction throughHowMuch, BooleanFunction isVisible, BooleanFunction useOpposites).
   * Only `length` is required in Java; the rest are @Opt.
   * Enum params (SiteType/AbsoluteDirection/RoleType) are represented by their name strings.
   */
  public constructor(
    _type: string | null,
    length: IntFunction,
    dirn: string | null = null,
    through: IntFunction | null = null,
    throughAny: RegionFunction | null = null,
    who: string | null = null,
    what: IntFunction | null = null,
    whats: readonly IntFunction[] | null = null,
    exact: BooleanFunction | boolean | null = null,
    contiguous: BooleanFunction | boolean | null = null,
    If: BooleanFunction | boolean | null = null,
    byLevel: BooleanFunction | boolean | null = null,
    top: BooleanFunction | boolean | null = null,
    throughHowMuch: IntFunction | null = null,
    _isVisible: BooleanFunction | boolean | null = null,
    useOpposites: BooleanFunction | boolean | null = null,
  ) {
    this.lengthFn = length;
    this.dirnName = dirn === null || dirn.includes(":") ? "Adjacent" : dirn;
    this.throughFn = through;
    this.throughAnyFn = throughAny;
    this.who = who;
    this.whatFns = whats ?? (what !== null ? [what] : null);
    // @java exact arrives from the compiler as a BooleanConstant (True/False are
    // wrapped — the raw-literal rule), NOT a raw boolean; boolFn handles both, so
    // (is Line N … exact:True) is now honoured (was silently defaulting to false,
    // making exact behave as >=N — Altan/Dala mills over-fired on 4-lines).
    this.exactFn = boolFn(exact, false);
    this.contiguousFn = boolFn(contiguous, true);
    this.conditionFn = boolFn(If, true);
    this.byLevelFn = boolFn(byLevel, false);
    this.topFn = boolFn(top, false);
    this.throughHowMuchFn = throughHowMuch;
    this.useOppositesFn = boolFn(useOpposites, true);
  }

  /**
   * @java game/functions/booleans/is/line/IsLine.java — eval(Context)
   *
   * Pivot = context._evalTo (Java: context.to()), which the play loop sets
   * to the last-placed site before calling end-rule eval.
   */
  public eval(ctx: Context): boolean {
    const origTo = ctx._evalTo;
    try {
      // @java IsLine.java:186-187 `if (context.game().isStacking()) return
      // evalStack(context);` — stacking games use an entirely different
      // algorithm (evalStack) where the pivot itself is gated only on piece
      // identity (scanned across every stack level), never on the "If"
      // condition; only ray-walked neighbour sites are condition-gated
      // (IsLine.java:1029,1073). A cancelled/"dead pair" placement (stack
      // height 2) is still a valid pivot as long as two further live
      // neighbours complete the line — the flat path below wrongly requires
      // the condition to hold AT the pivot too, so it silently drops every
      // moveAgain a cancel-placement should grant (Dig Dig ply 19/31).
      const isStacking = (ctx.game as unknown as { isStacking?: () => boolean }).isStacking?.() ?? false;
      if (isStacking) return this.evalStack(ctx);

      const pivots = this.pivots(ctx);
      const throughnum = this.throughHowMuchFn?.eval(ctx) ?? 1;
      for (const pivot of pivots) {
        if (pivot < 0 || pivot >= ctx.state.cells.length) continue;
        ctx._evalTo = pivot;
        if (!this.conditionFn.eval(ctx)) return false;

        const len = this.lengthFn.eval(ctx);
        if (len <= 0) continue;

        const targets = this.targetWhats(ctx, pivot, null);
        if (targets.size === 0) continue;

        if (this.byLevelFn.eval(ctx)) {
          if (this.evalByLevel(ctx, pivot, len, targets, throughnum)) return true;
          continue;
        }

        if (this.evalFlat(ctx, pivot, len, targets, throughnum)) return true;
      }
      return false;
    } finally {
      ctx._evalTo = origTo;
    }
  }

  private pivots(ctx: Context): number[] {
    if (this.throughAnyFn !== null) return [...this.throughAnyFn.eval(ctx)];
    if (this.throughFn !== null) return [this.throughFn.eval(ctx)];
    // @java IsLine.java:150 — through = (through == null) ? new LastTo(null)
    // : through. The default pivot is the LAST MOVE's destination, NOT the
    // context's (to) iterator binding: the _evalTo fallback only worked while
    // evalDeferredThens un-faithfully bound _evalTo to the applied move's to
    // (Java's context.to() is OFF at then-eval time — EvalContext.java:26).
    return [IsLine.lastToDefault.eval(ctx)];
  }

  /** Shared @java `new LastTo(null)` default pivot (stateless). */
  private static readonly lastToDefault = new LastTo();

  private targetWhats(ctx: Context, pivot: number, level: number | null): Set<number> {
    const explicit = this.whatFns;
    if (explicit !== null) {
      return new Set(explicit.map((fn) => fn.eval(ctx)).filter((what) => what !== 0));
    }

    const who = roleOwner(this.who, ctx);
    if (who !== null) {
      const out = new Set<number>();
      for (const component of ctx.components()) {
        const owner = Number(component?.owner ?? 0);
        const index = Number(component?.index ?? 0);
        if (owner === who && index > 0) out.add(index);
      }
      if (who > 0) out.add(who);
      return out;
    }

    const what = level === null
      ? ctx.state.what(pivot)
      : ctx.state.whatAtSiteLevel(pivot, level);
    return what === 0 ? new Set<number>() : new Set([what]);
  }

  private evalFlat(
    ctx: Context,
    pivot: number,
    len: number,
    targets: ReadonlySet<number>,
    throughnum: number,
  ): boolean {
    const state = ctx.state;
    if (!targets.has(state.whatAtSite(pivot))) return false;

    const exact = this.exactFn.eval(ctx);
    const contiguous = this.contiguousFn.eval(ctx);
    const useOpposites = this.useOppositesFn.eval(ctx);

    /**
     * Test whether `count` satisfies the length condition.
     * exact=false: count >= len
     * exact=true:  count === len (not part of a longer line)
     * @java IsLine.eval — exactLength branch
     */
    const matchesLen = (count: number): boolean =>
      exact ? count === len : count >= len;

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
        const seenWhats = new Set<number>([state.whatAtSite(pivot)]);
        const count = this.countFlatRay(ctx, ray, 1, targets, contiguous, seenWhats) + 1;
        // @java IsLine.eval — with opposites, the line length is the FULL count
        // through the pivot (forward + opposite). For exact:True the single
        // forward ray must NOT short-circuit (a 3-in-a-row that extends to 4 via
        // the opposite ray is not a line of EXACTLY 3 — Altan/Dala mills on the
        // Alquerque diagonal). Mirror the square path's else-branch.
        if (useOpposites && opposites.length > 0) {
          for (const opp of opposites) {
            const oppositeCount = count + this.countFlatRay(ctx, opp, 1, targets, contiguous, seenWhats);
            if (matchesLen(oppositeCount) && throughnum <= seenWhats.size) return true;
          }
        } else if (matchesLen(count) && throughnum <= seenWhats.size) {
          return true;
        }
      }
      return false;
    }

    // Square/rectangle path: use precomputed flat radials table.
    const radials = ctxAny._radials;
    if (radials === undefined) {
      throw new Error("IsLine(1:1): _radials not attached to context. BoardSurface must set ctx._radials.");
    }

    const cellRadials = radials[pivot];
    if (cellRadials === undefined) return false;

    const selectedAxes = selectAxes(cellRadials.axes, this.dirnName);

    // Java IsLine.eval lines 333-519: for each distinct radial, walk forward
    // then opposite, return true if count satisfies len condition.
    for (const { ray, opposite } of selectedAxes) {
      if (!ray || !opposite) continue; // guard against sparse axis arrays
      const seenWhats = new Set<number>([state.whatAtSite(pivot)]);
      const count = this.countFlatRay(ctx, ray, 1, targets, contiguous, seenWhats) + 1;
      if (useOpposites) {
        const oppositeCount = count + this.countFlatRay(ctx, opposite, 1, targets, contiguous, seenWhats);
        if (matchesLen(oppositeCount) && throughnum <= seenWhats.size) return true;
      } else if (matchesLen(count) && throughnum <= seenWhats.size) {
        return true;
      }
    }

    return false;
  }

  private countFlatRay(
    ctx: Context,
    ray: readonly number[],
    start: number,
    targets: ReadonlySet<number>,
    contiguous: boolean,
    seenWhats: Set<number>,
  ): number {
    let count = 0;
    for (let i = start; i < ray.length; i++) {
      const site = ray[i];
      if (site === undefined || site < 0 || site >= ctx.state.cells.length) break;
      ctx._evalTo = site;
      const what = ctx.state.what(site);
      if (targets.has(what) && this.conditionFn.eval(ctx)) {
        count++;
        seenWhats.add(what);
      } else if (contiguous) {
        break;
      }
    }
    return count;
  }

  /**
   * @java game/functions/booleans/is/line/IsLine.java:718-1095 `evalStack(Context)`.
   * Only the `through` pivot is consulted (unlike the flat path, `throughAny`
   * is never referenced inside Java's evalStack). Piece presence at a site is
   * checked across every stack level (or only the top when `top:True`); the
   * "If" condition is evaluated at ray-walked neighbour sites only, never at
   * the pivot itself (IsLine.java:975-995 has no `condition.eval` call).
   */
  private evalStack(ctx: Context): boolean {
    const pivot = this.throughFn !== null ? this.throughFn.eval(ctx) : IsLine.lastToDefault.eval(ctx);
    // @java IsLine.java:722-723 — `if (locn == Constants.UNDEFINED) return false;` (UNDEFINED === -1).
    if (pivot < 0) return false;

    const top = this.topFn.eval(ctx);
    const targets = this.targetWhats(ctx, pivot, null);

    // @java IsLine.java:759-761 — `if (len == 1) return true;` unconditionally,
    // before any pivot/piece check.
    const len = this.lengthFn.eval(ctx);
    if (len === 1) return true;
    if (len <= 0) return false;

    const byLevel = this.byLevelFn.eval(ctx);
    const throughnum = this.throughHowMuchFn?.eval(ctx) ?? 1;
    if (byLevel) return this.evalByLevel(ctx, pivot, len, targets, throughnum);

    const exact = this.exactFn.eval(ctx);
    const state = ctx.state;

    // @java IsLine.java:1008-1026 (mirrored for the pivot at 975-989) —
    // `top:True` checks only the top-of-stack `what`; otherwise every level
    // of the site's stack is scanned for a matching piece.
    const hasTarget = (site: number): boolean => {
      if (top) return targets.has(state.whatAtSite(site));
      const size = state.stackSize(site);
      for (let level = 0; level < size; level++) {
        if (targets.has(state.whatAtSiteLevel(site, level))) return true;
      }
      return false;
    };

    // @java IsLine.java:970-995 — pivot must contain a matching piece
    // somewhere in its stack; NOT gated on the "If" condition.
    if (!hasTarget(pivot)) return false;

    const axes = this.selectedRays(ctx, pivot);
    for (const { ray, opposites } of axes) {
      // @java IsLine.java:1001-1040 — forward ray, `ray[0]` is the pivot
      // itself (Trajectories.distinctRadialsByName), so walk from index 1.
      let count = 1;
      for (let i = 1; i < ray.length; i++) {
        const site = ray[i];
        if (site === undefined) break;
        ctx._evalTo = site;
        if (hasTarget(site) && this.conditionFn.eval(ctx)) {
          count++;
          if (!exact && count === len) return true;
        } else {
          break;
        }
      }

      // @java IsLine.java:1042-1091 — opposite ray(s), continuing the count
      // from the forward walk.
      if (opposites.length > 0) {
        for (const opposite of opposites) {
          let oppositeCount = count;
          for (let i = 1; i < opposite.length; i++) {
            const site = opposite[i];
            if (site === undefined) break;
            ctx._evalTo = site;
            if (hasTarget(site) && this.conditionFn.eval(ctx)) {
              oppositeCount++;
              if (!exact && oppositeCount === len) return true;
            } else {
              break;
            }
          }
          if (oppositeCount === len) return true;
        }
      } else if (count === len) {
        return true;
      }
    }

    return false;
  }

  private evalByLevel(
    ctx: Context,
    pivot: number,
    len: number,
    targets: ReadonlySet<number>,
    throughnum: number,
  ): boolean {
    const state = ctx.state;
    const sizeStack = state.stackSize(pivot);
    if (sizeStack <= 0) return false;
    const exact = this.exactFn.eval(ctx);

    if (sizeStack >= len) {
      const seenWhats = new Set<number>([state.whatAtSiteLevel(pivot, sizeStack - 1)]);
      let count = 1;
      for (let i = 0; i < len - 1; i++) {
        const what = state.whatAtSiteLevel(pivot, sizeStack - 2 - i);
        if (!targets.has(what)) break;
        count++;
        seenWhats.add(what);
        if (!exact && count === len && throughnum <= seenWhats.size) return true;
      }
      if (count === len && throughnum <= seenWhats.size) return true;
    }

    const levelOrigin = sizeStack - 1;
    const axes = this.selectedRays(ctx, pivot);
    for (const { ray, opposites } of axes) {
      if (this.evalLevelPattern(ctx, ray, opposites, len, targets, throughnum, (i) => levelOrigin)) return true;
      if (this.evalLevelPattern(ctx, ray, opposites, len, targets, throughnum, (i) => levelOrigin - i, (i) => levelOrigin + i)) return true;
      if (this.evalLevelPattern(ctx, ray, opposites, len, targets, throughnum, (i) => levelOrigin + i, (i) => levelOrigin - i)) return true;
    }
    return false;
  }

  private evalLevelPattern(
    ctx: Context,
    ray: readonly number[],
    opposites: readonly (readonly number[])[],
    len: number,
    targets: ReadonlySet<number>,
    throughnum: number,
    levelFor: (offset: number) => number,
    oppositeLevelFor: (offset: number) => number = levelFor,
  ): boolean {
    const exact = this.exactFn.eval(ctx);
    const seenWhats = new Set<number>();
    const count = this.countLevelRay(ctx, ray, 0, targets, levelFor, seenWhats);
    if (!exact && count >= len && throughnum <= seenWhats.size) return true;
    for (const opposite of opposites) {
      const localSeen = new Set(seenWhats);
      const oppositeCount = count + this.countLevelRay(ctx, opposite, 1, targets, oppositeLevelFor, localSeen);
      if ((exact ? oppositeCount === len : oppositeCount >= len) && throughnum <= localSeen.size) return true;
    }
    return opposites.length === 0 && (exact ? count === len : count >= len) && throughnum <= seenWhats.size;
  }

  private countLevelRay(
    ctx: Context,
    ray: readonly number[],
    start: number,
    targets: ReadonlySet<number>,
    levelFor: (offset: number) => number,
    seenWhats: Set<number>,
  ): number {
    let count = 0;
    for (let i = start; i < ray.length; i++) {
      const site = ray[i];
      const level = levelFor(i);
      if (site === undefined || site < 0 || site >= ctx.state.cells.length) break;
      if (level < 0 || ctx.state.stackSize(site) <= level) break;
      const what = ctx.state.whatAtSiteLevel(site, level);
      if (!targets.has(what)) break;
      ctx._evalTo = site;
      if (!this.conditionFn.eval(ctx)) break;
      count++;
      seenWhats.add(what);
    }
    return count;
  }

  private selectedRays(ctx: Context, pivot: number): Array<{ ray: readonly number[]; opposites: readonly (readonly number[])[] }> {
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null; _radials?: CellFlatRadials[] };
    const traj = ctxAny._trajectories;
    if (traj != null) {
      return traj.distinctRadialsByName(pivot, this.dirnName)
        .map(({ ray, opposites }) => ({ ray, opposites }));
    }
    const radials = ctxAny._radials;
    if (radials === undefined) {
      throw new Error("IsLine(1:1): _radials not attached to context. BoardSurface must set ctx._radials.");
    }
    const cellRadials = radials[pivot];
    if (cellRadials === undefined) return [];
    return selectAxes(cellRadials.axes, this.dirnName)
      .filter((axis) => axis.ray !== undefined && axis.opposite !== undefined)
      .map((axis) => ({ ray: axis.ray, opposites: [axis.opposite] }));
  }
}

function constBool(value: boolean): BooleanFunction {
  return { eval: () => value };
}

function boolFn(value: BooleanFunction | boolean | null, fallback: boolean): BooleanFunction {
  if (typeof value === "boolean") return constBool(value);
  return value ?? constBool(fallback);
}

function roleOwner(role: string | null, ctx: Context): number | null {
  if (role === null || role === "All" || role === "Each") return null;
  // @java RoleType.Player — the player iterated by (forEach Player …), carried
  // in _evalPlayer. Without this, (is Line N Player) fell through to the pivot's
  // single component, so a line of MIXED-size same-owner pieces (Gobblet's
  // small/medium/large) was not recognised and the game never ended.
  if (role === "Player") return (ctx as unknown as { _evalPlayer?: number })._evalPlayer ?? ctx.state.mover;
  if (role === "Mover") return ctx.state.mover;
  if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
  if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Shared" || role === "Neutral") return 0;
  return null;
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
