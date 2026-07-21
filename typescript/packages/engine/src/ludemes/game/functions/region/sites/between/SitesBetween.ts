// @java Core/src/game/functions/region/sites/between/SitesBetween.java

/**
 * For getting the sites (in the same radial) between two other sites.
 *
 * @java game/functions/region/sites/between/SitesBetween.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, BooleanFunction, DirectionsFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal radial step shape used by trajectory-based topology.
 * @java game.util.graph.Radial / RadialStep
 */
interface RadialStep {
  readonly id: number;
}

interface Radial {
  readonly steps: readonly RadialStep[];
}

interface TopologyLike {
  getGraphElements(type: string): Array<{ index: number }>;
  trajectories(): {
    radials(
      type: string | null,
      fromIndex: number,
      direction: string,
    ): Radial[];
  };
}

/**
 * For getting the sites (in the same radial) between two other sites.
 *
 * @java game/functions/region/sites/between/SitesBetween.java
 */
export class SitesBetween extends BaseRegionFunction {
  /** @java SitesBetween — fromFn */
  private readonly fromFn: IntFunction;

  /** @java SitesBetween — fromIncludedFn */
  private readonly fromIncludedFn: BooleanFunction;

  /** @java SitesBetween — toFn */
  private readonly toFn: IntFunction;

  /** @java SitesBetween — toIncludedFn */
  private readonly toIncludedFn: BooleanFunction;

  /** @java SitesBetween — betweenCond */
  private readonly betweenCond: BooleanFunction;

  /** @java SitesBetween — dirnChoice */
  private readonly dirnChoice: DirectionsFunction;

  /**
   * @param directions    The directions of the move [Adjacent].
   * @param type          The type of the graph element [Default SiteType].
   * @param from          The 'from' site.
   * @param fromIncluded  True if the 'from' site is included in the result [False].
   * @param to            The 'to' site.
   * @param toIncluded    True if the 'to' site is included in the result [False].
   * @param cond          The condition to include the site in between [True].
   * @java SitesBetween(Direction, SiteType, IntFunction, BooleanFunction, IntFunction, BooleanFunction, BooleanFunction)
   */
  public constructor(
    directions: DirectionsFunction | null,
    type: string | null,
    from: IntFunction,
    fromIncluded: BooleanFunction | null,
    to: IntFunction,
    toIncluded: BooleanFunction | null,
    cond: BooleanFunction | null,
  ) {
    super();
    this.fromFn = from;
    this.toFn = to;
    // @java fromIncludedFn = (fromIncluded == null) ? new BooleanConstant(false) : fromIncluded
    this.fromIncludedFn = fromIncluded ?? { eval: () => false };
    // @java toIncludedFn = (toIncluded == null) ? new BooleanConstant(false) : toIncluded
    this.toIncludedFn = toIncluded ?? { eval: () => false };
    this.siteType = type;
    // @java betweenCond = (cond == null) ? new BooleanConstant(true) : cond
    this.betweenCond = cond ?? { eval: () => true };
    // @java dirnChoice = (directions != null) ? directions.directionsFunctions() : new Directions(Adjacent, null)
    this.dirnChoice = directions ?? { eval: () => ["Adjacent"] };
  }

  /**
   * Returns all sites between fromFn and toFn along a shared radial.
   *
   * @java SitesBetween.eval(Context)
   *
   * Java parity:
   *   1. Evaluate from/to.
   *   2. If from or to <= OFF return empty region.
   *   3. Save/restore context from/to/between scratch.
   *   4. Set from+to on context, include from/to if requested.
   *   5. For each direction, for each radial from fromV:
   *      find to in radial.steps, then collect between sites (backwards from toIdx-1 to 1).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java final int from = fromFn.eval(context)
    const from = this.fromFn.eval(ctx);

    // @java if (from <= Constants.OFF) return new Region()
    if (from <= OFF) return [];

    // @java final int to = toFn.eval(context)
    const to = this.toFn.eval(ctx);

    // @java if (to <= Constants.OFF) return new Region()
    if (to <= OFF) return [];

    // @java final Topology topology = context.topology()
    const topology = (ctx as unknown as { topology?: () => TopologyLike | null; _topology?: TopologyLike }).topology?.()
      ?? (ctx as unknown as { _topology?: TopologyLike })._topology;

    // @java final SiteType realType = (type != null) ? type : context.game().board().defaultSite()
    const realType: string = this.siteType ?? (
      (ctx as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
    );

    if (!topology) {
      // No topology available — return empty region (cannot compute between without graph)
      return [];
    }

    // @java if (from >= topology.getGraphElements(realType).size()) return new Region()
    const elements = topology.getGraphElements(realType);
    if (from >= elements.length) return [];

    // @java if (to >= topology.getGraphElements(realType).size()) return new Region()
    if (to >= elements.length) return [];

    // @java final int origFrom = context.from(); origTo = context.to(); origBetween = context.between()
    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;
    const origBetween = ctx._evalBetween;

    const sites: number[] = [];

    // @java context.setFrom(from); context.setTo(to)
    ctx._evalFrom = from;
    ctx._evalTo = to;

    // @java if (fromIncludedFn.eval(context)) sites.add(from)
    if (this.fromIncludedFn.eval(ctx)) sites.push(from);

    // @java if (toIncludedFn.eval(context)) sites.add(to)
    if (this.toIncludedFn.eval(ctx)) sites.push(to);

    // @java final List<AbsoluteDirection> directions = dirnChoice.convertToAbsolute(...)
    const directions = this.dirnChoice.eval(ctx);

    let toFound = false;

    // @java for (final AbsoluteDirection direction : directions)
    for (const direction of directions) {
      if (toFound) break;

      // @java final List<Radial> radials = topology.trajectories().radials(type, fromV.index(), direction)
      const radials = topology.trajectories().radials(this.siteType ?? null, from, direction);

      for (const radial of radials) {
        if (toFound) break;

        // @java context.setBetween(origBetween)
        ctx._evalBetween = origBetween;

        // @java for (int toIdx = 1; toIdx < radial.steps().length; toIdx++)
        for (let toIdx = 1; toIdx < radial.steps.length; toIdx++) {
          const site = radial.steps[toIdx]!.id;
          if (site === to) {
            // @java for (int betweenIdx = toIdx - 1; betweenIdx >= 1; betweenIdx--)
            for (let betweenIdx = toIdx - 1; betweenIdx >= 1; betweenIdx--) {
              const between = radial.steps[betweenIdx]!.id;
              // @java context.setBetween(between)
              ctx._evalBetween = between;
              // @java if (betweenCond.eval(context)) sites.add(between)
              if (this.betweenCond.eval(ctx)) {
                sites.push(between);
              }
            }
            toFound = true;
            break;
          }
        }
      }
    }

    // @java context.setTo(origTo); context.setFrom(origFrom); context.setBetween(origBetween)
    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;
    ctx._evalBetween = origBetween;

    return sites;
  }

  /**
   * @java SitesBetween.isStatic()
   */
  public override isStatic(): boolean {
    return (
      (this.fromFn as unknown as { isStatic?: () => boolean }).isStatic?.() !== false &&
      (this.fromIncludedFn as unknown as { isStatic?: () => boolean }).isStatic?.() !== false &&
      (this.toFn as unknown as { isStatic?: () => boolean }).isStatic?.() !== false &&
      (this.toIncludedFn as unknown as { isStatic?: () => boolean }).isStatic?.() !== false &&
      (this.betweenCond as unknown as { isStatic?: () => boolean }).isStatic?.() !== false
    );
  }

  /** @java SitesBetween.toString() */
  public override toString(): string {
    return "SitesBetween()";
  }
}
