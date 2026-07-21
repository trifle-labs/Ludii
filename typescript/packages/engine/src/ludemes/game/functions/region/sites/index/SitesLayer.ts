// @java Core/src/game/functions/region/sites/index/SitesLayer.java

/**
 * Returns all the sites in a specific layer of the board.
 *
 * @java game/functions/region/sites/index/SitesLayer.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal topology interface for layers. */
interface TopologyLayers {
  layers(type: string): Array<number[]>;
}

/**
 * Returns all the sites in a specific layer of the board.
 *
 * @java game/functions/region/sites/index/SitesLayer.java
 */
export class SitesLayer extends BaseRegionFunction {
  /** @java SitesLayer — precomputedRegion (cached after preprocess if static) */
  private precomputedRegion: number[] | null = null;

  /** @java SitesLayer — index */
  private readonly index: IntFunction | null;

  /**
   * @param elementType Type of graph elements to return [Cell (or Vertex if the
   *                    main board uses intersections)].
   * @param index       Index of the layer.
   * @java SitesLayer(SiteType, IntFunction)
   */
  public constructor(elementType: string | null, index: IntFunction | null) {
    super();
    this.siteType = elementType;
    this.index = index;
  }

  /**
   * Returns all sites in the specified layer.
   *
   * @java SitesLayer.eval(Context)
   *
   * Java parity:
   *   if (precomputedRegion != null) return precomputedRegion;
   *   final SiteType realType = (type != null) ? type : context.board().defaultSite();
   *   final Topology graph = context.topology();
   *   if (index == null) return new Region();
   *   final int i = index.eval(context);
   *   if (i < 0) { log; return new Region(); }
   *   return new Region(graph.layers(realType).get(i));
   */
  public override eval(context: Context & EvalScratch): number[] {
    // @java if (precomputedRegion != null) return precomputedRegion
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java final SiteType realType = (type != null) ? type : context.board().defaultSite()
    const realType: string = this.siteType ?? (
      (context as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
    );

    // @java if (index == null) return new Region()
    if (this.index === null) {
      return [];
    }

    const i = this.index.eval(context);

    // @java if (i < 0) { System.out.println("** Negative layer index."); return new Region(); }
    if (i < 0) {
      console.log("** Negative layer index.");
      return [];
    }

    // @java return new Region(graph.layers(realType).get(i))
    const ctxAny = context as unknown as {
      _trajectories?: TopologyLayers | null;
      topology?: () => TopologyLayers | null;
    };

    const traj = ctxAny._trajectories ?? ctxAny.topology?.();

    if (traj && typeof (traj as unknown as Record<string, unknown>).layers === "function") {
      const layersList = traj.layers(realType);
      if (i >= layersList.length) return [];
      const layer = layersList[i];
      if (!layer) return [];
      return [...layer];
    }

    // Fallback: no topology layers available
    return [];
  }

  /** @java SitesLayer.isStatic() */
  public override isStatic(): boolean {
    if (this.index !== null) {
      return (this.index as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    }
    return true;
  }

  /** @java SitesLayer.toString() */
  public override toString(): string {
    return "Layer()";
  }
}
