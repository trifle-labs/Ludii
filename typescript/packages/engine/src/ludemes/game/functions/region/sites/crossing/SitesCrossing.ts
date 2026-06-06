// @java Core/src/game/functions/region/sites/crossing/SitesCrossing.java

/**
 * Returns all the sites (edges) crossing a given edge.
 *
 * @java game/functions/region/sites/crossing/SitesCrossing.java
 * @author tahmina
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Segment-crossing helper
// @java main.math.MathRoutines.isCrossing
// ---------------------------------------------------------------------------

function segmentsCross(
  a0x: number, a0y: number, a1x: number, a1y: number,
  b0x: number, b0y: number, b1x: number, b1y: number,
): boolean {
  const EPSILON = 0.0000001;
  const MARGIN = 0.01;
  const xlk = a1x - a0x;
  const ylk = a1y - a0y;
  const xnm = b1x - b0x;
  const ynm = b1y - b0y;
  const xmk = b0x - a0x;
  const ymk = b0y - a0y;
  const det = xnm * ylk - ynm * xlk;
  if (Math.abs(det) < EPSILON) return false;
  const detinv = 1.0 / det;
  const s = (xnm * ymk - ynm * xmk) * detinv;
  const t = (xlk * ymk - ylk * xmk) * detinv;
  return s > MARGIN && s < 1 - MARGIN && t > MARGIN && t < 1 - MARGIN;
}

/** Get [ax, ay, bx, by] for an edge by index, via Trajectories or topology. */
function getEdgePts(
  traj: Trajectories,
  edgeIdx: number,
): readonly [number, number, number, number] | undefined {
  if (traj.kind === "Edge") {
    return traj.edgeEndpointPts(edgeIdx);
  }
  const core = (traj as unknown as {
    core?: { topo?: { edgeEls?: Array<{
      va: { pt: { x: number; y: number } };
      vb: { pt: { x: number; y: number } };
    }> } }
  }).core;
  const edgeEls = core?.topo?.edgeEls;
  if (!edgeEls || edgeIdx >= edgeEls.length) return undefined;
  const e = edgeEls[edgeIdx];
  if (!e) return undefined;
  return [e.va.pt.x, e.va.pt.y, e.vb.pt.x, e.vb.pt.y];
}

/** Count of edges in the topology. */
function numEdges(traj: Trajectories): number {
  if (traj.kind === "Edge") return traj.numSites;
  const core = (traj as unknown as {
    core?: { topo?: { edgeEls?: unknown[] } }
  }).core;
  return core?.topo?.edgeEls?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

/**
 * Returns all edge sites that cross the specified starting edge and are owned
 * by (or occupied by) the specified player or role.
 *
 * @java game.functions.region.sites.crossing.SitesCrossing
 */
export class SitesCrossing extends BaseRegionFunction {
  /** @java SitesCrossing — private final IntFunction startLocationFn */
  private readonly startLocationFn: IntFunction;
  /** @java SitesCrossing — private final IntFunction roleFunc */
  private readonly roleFunc: IntFunction;

  /**
   * @java SitesCrossing(IntFunction, Player, RoleType)
   * @param startLocationFn The edge site to check crossings from.
   * @param roleFunc        Player or role index function.
   */
  public constructor(startLocationFn: IntFunction, roleFunc: IntFunction) {
    super();
    this.startLocationFn = startLocationFn;
    this.roleFunc = roleFunc;
  }

  /**
   * @java SitesCrossing.eval(Context)
   * Returns all edges crossing the start edge that belong to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesCrossing.java:61-62 — get from site, return empty if OFF
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return [];

    // @java SitesCrossing.java:63-65 — get topology and state
    const aPts = getEdgePts(traj, from);
    if (!aPts) return [];

    const [a0x, a0y, a1x, a1y] = aPts;
    const numPlayers = ctx.game.numPlayers;
    // @java SitesCrossing.java:67-68 — evaluate who/role
    const whoSiteId = this.roleFunc.eval(ctx);

    // @java SitesCrossing.java:70-80 — resolve player index
    let player: number;
    if (whoSiteId === 0) {
      // @java SitesCrossing.java:73 — graph game check
      const isGraphGame = (ctx.game as unknown as { isGraphGame?: () => boolean }).isGraphGame?.() ?? false;
      if (isGraphGame) {
        player = whoSiteId;
      } else {
        return [];
      }
    } else {
      player = whoSiteId;
    }
    void player; // used for filter logic below

    const groupItems: number[] = [];
    const n = numEdges(traj);

    // @java SitesCrossing.java:85-113 — iterate edges and check crossing
    for (let k = 0; k < n; k++) {
      // @java SitesCrossing.java:87-90 — filter by ownership
      const what = ctx.state.whatAtSite?.(k) ?? (ctx.state.cells[k] ?? 0);
      const who = ctx.state.cells[k] ?? 0;
      const occupied =
        (whoSiteId === numPlayers + 1 && what !== 0) ||
        (player < numPlayers + 1 && who === whoSiteId);
      if (!occupied) continue;

      if (from !== k) {
        const bPts = getEdgePts(traj, k);
        if (!bPts) continue;
        const [b0x, b0y, b1x, b1y] = bPts;
        // @java SitesCrossing.java:104 — MathRoutines.isCrossing(...)
        if (segmentsCross(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y)) {
          groupItems.push(k);
        }
      }
    }

    return groupItems;
  }

  /** @java SitesCrossing.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
