// @java Core/src/game/functions/region/sites/simple/SitesInner.java

/**
 * Returns all the inner sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesInner.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Minimal topology surface used here.
 * @java other/topology/Topology
 */
interface TopologyLike {
  inner(type: string | null): number[];
}

/**
 * Returns all the inner sites of the board.
 *
 * Java parity: eval delegates to graph.inner(realType).
 *
 * @java game.functions.region.sites.simple.SitesInner
 */
export class SitesInner extends BaseRegionFunction {
  /** @java SitesInner — precomputedRegion */
  private precomputedRegion: number[] | null = null;

  /**
   * @param elementType Type of graph elements to return [Cell or Vertex], or null for default.
   * @java SitesInner(SiteType)
   */
  public constructor(elementType: string | null = null) {
    super();
    this.siteType = elementType;
  }

  /**
   * @java SitesInner.eval(Context)
   *
   * Returns the inner sites of the board topology for the given element type.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesInner.java:47-48 — precomputed cache
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java SitesInner.java:50-51 — realType
    const ctxAny = ctx as unknown as {
      game?: { board?: () => { defaultSite?: () => string } };
      board?: () => {
        defaultSite?: () => string;
        topology?: () => TopologyLike;
      };
      topology?: () => TopologyLike;
    };

    const realType: string =
      this.siteType ??
      // @java SitesInner.java:51 — context.game().board().defaultSite()
      ctxAny.game?.board?.()?.defaultSite?.() ??
      ctxAny.board?.()?.defaultSite?.() ??
      "Cell";

    // @java SitesInner.java:53-54 — graph.inner(realType). Java's topology.inner
    // list is populated by MeasureGraph.measureInnerOuter (INNER = every element
    // not OUTER). The eval/graph topology build never runs that derivation, so
    // the topology's _inner list is empty; resolve inner as the complement of the
    // OUTER perimeter set via the trajectories, exactly as SitesOuter resolves
    // outer. This keeps `(sites Inner)` and `(sites Outer)` consistent for every
    // board shape (Unlur's opening restriction to inner cells now generates).
    const traj = (ctx as unknown as {
      _trajectories?: {
        viewOf(kind: string): { innerSites(): number[] };
      } | null;
    })._trajectories;
    if (traj) {
      return traj.viewOf(realType).innerSites();
    }

    // @java fallback — topology.inner(realType) when no trajectories present.
    const topo: TopologyLike | undefined =
      ctxAny.board?.()?.topology?.() ?? ctxAny.topology?.();

    if (!topo) return [];

    return topo.inner(realType);
  }

  /** @java SitesInner.isStatic() */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesInner.toString() */
  public override toString(): string {
    return "Inner()";
  }

  /** @java SitesInner.preprocess(Game) */
  public preprocess(game: unknown): void {
    // @java SitesInner.java:105-107 — type = SiteType.use(type, game); precompute
    if (this.siteType === null) {
      const gameAny = game as unknown as {
        board?: () => { defaultSite?: () => string };
      };
      this.siteType =
        gameAny.board?.()?.defaultSite?.() ?? "Cell";
    }
    // @java SitesInner.java:107 — precomputedRegion = eval(new Context(game, null));
    // Skipped: no Context(game, null) equivalent in TS; will be computed lazily.
  }

  /** @java SitesInner.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return "the inner sites of the board";
  }
}
