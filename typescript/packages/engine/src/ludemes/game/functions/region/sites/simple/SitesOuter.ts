// @java Core/src/game/functions/region/sites/simple/SitesOuter.java

/**
 * Returns all the outer sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesOuter.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns all the outer sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesOuter.java
 *
 * Java parity: eval delegates to graph.outer(realType).
 * TS: for square boards returns border/perimeter cells.
 *     For graph boards, uses topology outer() method.
 */
export class SitesOuter extends BaseRegionFunction {
  /** @java SitesOuter — precomputedRegion (cached after first eval if static) */
  private precomputedRegion: number[] | null = null;

  /**
   * @param elementType Type of graph elements to return [Cell (or Vertex if the
   *                    main board uses intersections)].
   * @java SitesOuter(SiteType)
   */
  public constructor(elementType: string | null = null) {
    super();
    this.siteType = elementType;
  }

  /**
   * Returns all the outer sites of the board.
   *
   * @java SitesOuter.eval(Context)
   *
   * Java parity:
   *   if (precomputedRegion != null) return precomputedRegion;
   *   final SiteType realType = (type != null) ? type : context.board().defaultSite();
   *   final Topology graph = context.topology();
   *   return new Region(graph.outer(realType));
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java if (precomputedRegion != null) return precomputedRegion
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java final SiteType realType = (type != null) ? type : context.board().defaultSite()
    const realType: string = this.siteType ?? (
      (ctx as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
    );

    // @java graph.outer(realType) — try topology first
    const ctxAny = ctx as unknown as {
      _trajectories?: {
        outer?(type: string): number[];
        core?: { topo?: { outerEls?: number[]; cells?: Array<{ id: number }> } };
      } | null;
      topology?: () => {
        outer?(type: string): number[];
      };
    };

    const traj = ctxAny._trajectories;
    if (traj) {
      // Check for outer() method on trajectories
      if (typeof (traj as unknown as Record<string, unknown>).outer === "function") {
        return (traj as unknown as { outer(type: string): number[] }).outer(realType);
      }
      // Check for outerEls in core topo
      const outerEls = traj.core?.topo?.outerEls;
      if (outerEls && outerEls.length > 0) {
        return [...outerEls];
      }
    }

    // @java SitesOuter — square board: perimeter cells
    const g = ctx.game as unknown as {
      equipment?: { board?: { width?: number; height?: number; numSites?: number } };
    };
    const W = g.equipment?.board?.width ?? 8;
    const H = g.equipment?.board?.height ?? 8;
    const numSites = g.equipment?.board?.numSites ?? (W * H);

    const result: number[] = [];
    for (let i = 0; i < numSites; i++) {
      const col = i % W;
      const row = Math.floor(i / W);
      if (row === 0 || row === H - 1 || col === 0 || col === W - 1) {
        result.push(i);
      }
    }
    void realType; // suppress unused warning
    return result;
  }

  /** @java SitesOuter.isStatic() — true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesOuter.toString() */
  public override toString(): string {
    return "Outer()";
  }
}
