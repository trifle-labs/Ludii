// @java Core/src/game/functions/region/sites/index/SitesSupport.java

/**
 * Returns the sites which are supporting other pieces on sites on top of them.
 *
 * @java game/functions/region/sites/index/SitesSupport.java
 * @author Cedric Antoine
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal ContainerState shape for what() access. */
interface ContainerStateLike {
  what(site: number, type: string): number;
}

/** Minimal topology element shape. */
interface TopologyElementLike {
  index: number;
}

/** Minimal topology step shape. */
interface StepLike {
  to(): { id(): number };
}

/** Minimal topology for trajectories steps. */
interface TopologyLike {
  getGraphElements(type: string): TopologyElementLike[];
  trajectories(): {
    steps(
      fromType: string,
      fromIndex: number,
      toType: string,
      direction: string,
    ): StepLike[];
  };
}

/**
 * Returns the sites which are supporting other pieces on sites on top of them.
 *
 * @java game/functions/region/sites/index/SitesSupport.java
 */
export class SitesSupport extends BaseRegionFunction {
  /** @java SitesSupport — locnFn (piece type to be supported) */
  private readonly locnFn: IntFunction | null;

  /**
   * @param type  Type of graph element [default SiteType of the board].
   * @param what  The type of pieces to be supported by the sites looked for.
   * @java SitesSupport(SiteType, IntFunction)
   */
  public constructor(type: string | null, what: IntFunction | null) {
    super();
    this.siteType = type;
    // @java locnFn = (what != null) ? what : null
    this.locnFn = what ?? null;
  }

  /**
   * Returns all sites supporting pieces above them.
   *
   * @java SitesSupport.eval(Context)
   *
   * Java parity:
   *   int value = (locnFn != null) ? locnFn.eval(context) : -1;
   *   For each site, check UNW/USW/UNE/USE directions;
   *   if there's a piece (or piece == value) above, add site to result.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java int value = (locnFn != null) ? locnFn.eval(context) : -1
    const value: number = this.locnFn !== null ? this.locnFn.eval(ctx) : -1;

    // @java final TopologyElement vertexLoc = context.topology().vertices().get(0)
    // @java final ContainerState state = context.state().containerStates()[context.containerId()[vertexLoc.index()]]
    const ctxAny = ctx as unknown as {
      topology?: () => TopologyLike | null;
      _topology?: TopologyLike;
      state?: {
        containerStates?: () => ContainerStateLike[];
      };
      containerId?: () => number[];
    };

    const topology = ctxAny.topology?.() ?? ctxAny._topology;
    if (!topology) return [];

    const realType: string = this.siteType ?? "Cell";

    // @java final List<? extends TopologyElement> sites = context.topology().getGraphElements(type)
    const elements = topology.getGraphElements(realType);

    // Resolve container state (use containerStates()[0] for vertex-based lookup)
    const cstates = ctxAny.state?.containerStates?.();
    if (!cstates || cstates.length === 0) return [];
    // @java context.containerId()[vertexLoc.index()] — use index 0 for container
    const state: ContainerStateLike = cstates[0]!;

    const sitesFree: number[] = [];

    // @java for (final TopologyElement site : sites)
    for (const site of elements) {
      // @java get UNW/USW/UNE/USE steps from trajectories
      const trajs = topology.trajectories();
      const unw = trajs.steps(realType, site.index, realType, "UNW");
      const usw = trajs.steps(realType, site.index, realType, "USW");
      const une = trajs.steps(realType, site.index, realType, "UNE");
      const use = trajs.steps(realType, site.index, realType, "USE");

      let hasValidDirection = false;

      if (value === -1) {
        // @java Original logic when value is -1
        if (unw.length > 0 && state.what(unw[0]!.to().id(), realType) !== 0) {
          hasValidDirection = true;
        }
        if (usw.length > 0 && state.what(usw[0]!.to().id(), realType) !== 0) {
          hasValidDirection = true;
        }
        if (une.length > 0 && state.what(une[0]!.to().id(), realType) !== 0) {
          hasValidDirection = true;
        }
        if (use.length > 0 && state.what(use[0]!.to().id(), realType) !== 0) {
          hasValidDirection = true;
        }
      } else if (value >= 0) {
        // @java New logic when value is positive
        if (unw.length > 0 && state.what(unw[0]!.to().id(), realType) === value) {
          hasValidDirection = true;
        }
        if (usw.length > 0 && state.what(usw[0]!.to().id(), realType) === value) {
          hasValidDirection = true;
        }
        if (une.length > 0 && state.what(une[0]!.to().id(), realType) === value) {
          hasValidDirection = true;
        }
        if (use.length > 0 && state.what(use[0]!.to().id(), realType) === value) {
          hasValidDirection = true;
        }
      }

      // @java if (hasValidDirection) sites_free.add(site.index())
      if (hasValidDirection) {
        sitesFree.push(site.index);
      }
    }

    return sitesFree;
  }

  /**
   * @java SitesSupport.isStatic() — we're looking at "free" in a specific context, so never static
   */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesSupport.toString() */
  public override toString(): string {
    if (this.siteType === null) return "Null type in Free.";
    return "FreeVertex()";
  }
}
