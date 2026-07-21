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

/**
 * Minimal ContainerState shape for what() access.
 * @java other.state.container.ContainerState#what(int, SiteType)
 */
interface ContainerStateLike {
  what(site: number, type: string): number;
}

/**
 * Minimal topology element shape — `index()` is a METHOD on the real
 * TopologyElement (@java TopologyElement#index()), not a property. Reading it
 * as `.index` (undefined) previously made every step lookup key off
 * `undefined`, and the final `sites_free.add(site.index())` pushed
 * `undefined` into the result region.
 */
interface TopologyElementLike {
  index(): number;
}

/** Minimal topology step shape. @java game.util.graph.Step */
interface StepLike {
  to(): { id(): number };
}

/**
 * Minimal topology for trajectories steps.
 * @java Topology#getGraphElements(SiteType) / Topology#trajectories()
 */
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
   *   final TopologyElement vertexLoc = context.topology().vertices().get(0);
   *   final ContainerState state = context.state().containerStates()[context.containerId()[vertexLoc.index()]];
   *   For each site, check UNW/USW/UNE/USE directions (the four "upward
   *   diagonal" steps a pyramidal/Shibumi stack uses to reach the piece
   *   resting on this site and its three neighbours one layer up);
   *   if there's a piece (or piece == value) above, add site to result.
   *
   * The TS Context has no `state().containerStates()[containerId]` path (that
   * API was never ported) — `context.containerState(0)` is the faithful
   * equivalent for the single-board games (Spargo/Spirit) this function
   * targets, matching the idiom used by SitesLoop / CountSitesPlatformBelow.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java int value = (locnFn != null) ? locnFn.eval(context) : -1
    const value: number = this.locnFn !== null ? this.locnFn.eval(ctx) : -1;

    const ctxAny = ctx as unknown as {
      board?: () => { defaultSite(): string };
      topology?: () => TopologyLike;
      containerState?: (idx: number) => ContainerStateLike;
    };

    const topology = ctxAny.topology?.();
    if (!topology) return [];

    // @java type = SiteType.use(type, game) — resolved here at eval time
    // (rather than compile-time preprocess) since Context exposes the same
    // board().defaultSite() the Java preprocess() step reads. Hard-coding
    // "Cell" broke every Vertex-play board (Spargo/Spirit use `use:Vertex`).
    const realType: string =
      this.siteType ?? ctxAny.board?.().defaultSite() ?? "Cell";

    // @java final List<? extends TopologyElement> sites = context.topology().getGraphElements(type)
    const elements = topology.getGraphElements(realType);

    // @java final ContainerState state = context.state().containerStates()[context.containerId()[vertexLoc.index()]]
    const state = ctxAny.containerState?.(0);
    if (!state) return [];

    const sitesFree: number[] = [];
    const trajs = topology.trajectories();

    // @java for (final TopologyElement site : sites)
    for (const site of elements) {
      const idx = site.index();

      // @java get UNW/USW/UNE/USE steps from trajectories
      const unw = trajs.steps(realType, idx, realType, "UNW");
      const usw = trajs.steps(realType, idx, realType, "USW");
      const une = trajs.steps(realType, idx, realType, "UNE");
      const use = trajs.steps(realType, idx, realType, "USE");

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
        sitesFree.push(idx);
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
