// @java Core/src/game/functions/region/math/Expand.java

/**
 * Expands a given region/site in all directions the specified number of steps.
 *
 * @java game/functions/region/math/Expand.java
 * @author cambolbro and Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Minimal topology surface used for expansion.
 * @java other/topology/Topology
 */
interface TopologyLike {
  /** Returns neighbours of a site for a given SiteType. */
  neighbours(site: number, siteType: string | null): number[];
}

/**
 * Minimal container surface used to obtain the topology.
 * @java game/equipment/container/Container
 */
interface ContainerLike {
  topology(): TopologyLike;
}

/**
 * Expands a given region/site in all directions the specified number of steps.
 *
 * Java parity: eval delegates to Region.expand(region, graph, num, type) or
 * Region.expand(region, graph, num, direction, type). The TS port resolves the
 * container topology via context and iterates neighbourhoods.
 *
 * @java game.functions.region.math.Expand
 */
export class Expand extends BaseRegionFunction {
  /** @java Expand — ContainerId containerId */
  private readonly containerIdFn: IntFunction | null;
  /** @java Expand — String containerName */
  private readonly containerName: string | null;
  /** @java Expand — IntArrayFromRegion baseRegion (origin or region) */
  private readonly originFn: IntFunction | null;
  private readonly regionFn: RegionFunction | null;
  /** @java Expand — IntFunction numSteps */
  private readonly numSteps: IntFunction;
  /** @java Expand — AbsoluteDirection direction */
  private readonly direction: string | null;

  /** @java Expand — precomputedRegion */
  private precomputedRegion: number[] | null = null;

  /**
   * @param containerIdFn  Optional container index function.
   * @param containerName  Optional container name string.
   * @param regionFn       The base region (Or2 with originFn).
   * @param originFn       The origin site (Or2 with regionFn).
   * @param steps          The number of expansion steps [default 1].
   * @param direction      The absolute direction to expand, or null for all.
   * @param siteType       The graph element type, or null for board default.
   * @java Expand(IntFunction, String, RegionFunction, IntFunction, IntFunction, AbsoluteDirection, SiteType)
   */
  public constructor(
    containerIdFn: IntFunction | null,
    containerName: string | null,
    regionFn: RegionFunction | null,
    originFn: IntFunction | null,
    steps: IntFunction | null,
    direction: string | null,
    siteType: string | null,
  ) {
    super();
    this.containerIdFn = containerIdFn;
    this.containerName = containerName;
    this.regionFn = regionFn;
    this.originFn = originFn;
    // @java Expand.java:93 — numSteps = (steps == null) ? new IntConstant(1) : steps
    this.numSteps = steps ?? { eval: (_ctx: Context & EvalScratch) => 1 };
    this.direction = direction;
    this.siteType = siteType;
  }

  /**
   * @java Expand.eval(Context)
   *
   * Evaluates the container id, builds the base region from the origin or
   * region function, then expands by numSteps steps using the topology.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java Expand.java:101 — precomputed cache
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java Expand.java:103 — resolve container id
    const ctxAny = ctx as unknown as {
      containers?: () => ContainerLike[];
      board?: () => { defaultSite?: () => string; topology?: () => TopologyLike };
      topology?: () => TopologyLike;
      _trajectories?: { steps?: (site: number, dir: string) => number[] } | null;
    };

    let cid = 0;
    if (this.containerIdFn !== null) {
      cid = this.containerIdFn.eval(ctx);
    }

    // @java Expand.java:105-107 — build base region
    let baseRegion: number[];
    if (this.originFn !== null) {
      const site = this.originFn.eval(ctx);
      baseRegion = site === UNDEFINED ? [] : [site];
    } else if (this.regionFn !== null) {
      baseRegion = this.regionFn.eval(ctx);
    } else {
      baseRegion = [];
    }

    // @java Expand.java:109-118 — expand
    const num = this.numSteps.eval(ctx);
    if (num <= 0) {
      return baseRegion.slice();
    }

    // Resolve topology from container or board.
    let topo: TopologyLike | null = null;
    if (ctxAny.containers) {
      const containers = ctxAny.containers();
      if (cid >= 0 && cid < containers.length) {
        const c = containers[cid];
        if (c && typeof c.topology === "function") topo = c.topology();
      }
    }
    if (topo === null && ctxAny.board) {
      const board = ctxAny.board();
      if (board && board.topology) topo = board.topology();
    }
    if (topo === null && ctxAny.topology) {
      topo = ctxAny.topology();
    }

    // Perform BFS expansion.
    const resultSet = new Set<number>(baseRegion);
    let frontier = new Set<number>(baseRegion);

    for (let step = 0; step < num; step++) {
      const nextFrontier = new Set<number>();
      for (const site of frontier) {
        const neighbours: number[] = neighboursOf(topo, ctxAny._trajectories ?? null, site, this.direction);
        for (const nb of neighbours) {
          if (!resultSet.has(nb)) {
            resultSet.add(nb);
            nextFrontier.add(nb);
          }
        }
      }
      if (nextFrontier.size === 0) break;
      frontier = nextFrontier;
    }

    return Array.from(resultSet).sort((a, b) => a - b);
  }

  /** @java Expand.isStatic() */
  public override isStatic(): boolean {
    // @java Expand.java:125
    const baseStatic = this.regionFn
      ? (this.regionFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false
      : this.originFn
        ? (this.originFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false
        : true;
    const numStepsStatic =
      (this.numSteps as unknown as { isStatic?: () => boolean }).isStatic?.() ?? true;
    return baseStatic && numStepsStatic;
  }

  /** @java Expand.preprocess(Game) */
  public preprocess(game: unknown): void {
    // @java Expand.java:192-199
    const gameAny = game as unknown as {
      board?: () => { defaultSite?: () => string };
    };
    if (this.siteType === null && gameAny.board) {
      const board = gameAny.board();
      if (board && board.defaultSite) {
        this.siteType = board.defaultSite();
      }
    }

    (this.regionFn as unknown as { preprocess?: (g: unknown) => void })?.preprocess?.(game);
    (this.originFn as unknown as { preprocess?: (g: unknown) => void })?.preprocess?.(game);
    (this.numSteps as unknown as { preprocess?: (g: unknown) => void })?.preprocess?.(game);

    if (this.isStatic()) {
      // We would need a context to precompute — skip for now (no Context(game, null) equivalent).
      // @java Expand.java:198 — precomputedRegion = eval(new Context(game, null));
    }
  }

  /** @java Expand.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const baseStr = this.regionFn
      ? (this.regionFn as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "region"
      : this.originFn
        ? (this.originFn as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "site"
        : "region";
    const stepsStr =
      (this.numSteps as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ??
      String((this.numSteps as unknown as { eval?: () => number }).eval?.() ?? 1);
    return `${baseStr} expanded by ${stepsStr} steps`;
  }
}

function neighboursOf(
  topo: TopologyLike | null,
  trajectories: { steps?: (site: number, dir: string) => number[] } | null,
  site: number,
  direction: string | null,
): number[] {
  if (topo !== null && typeof topo.neighbours === "function") {
    return topo.neighbours(site, null);
  }
  if (trajectories?.steps !== undefined) {
    return trajectories.steps(site, direction ?? "Adjacent");
  }
  return [];
}
