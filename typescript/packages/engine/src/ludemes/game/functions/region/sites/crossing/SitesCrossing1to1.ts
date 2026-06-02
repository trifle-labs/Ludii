/**
 * SitesCrossing1to1.ts
 * @java game/functions/region/sites/crossing/SitesCrossing.java
 *
 * (sites Crossing at:<edge> who:<player>) — all edge sites that cross the
 * given edge and are owned by the specified player (or anyone when
 * whoSiteId == numPlayers+1).
 *
 * Java eval (SitesCrossing.java:61-115):
 *   - Get the kEdge (graph edge at `from`).
 *   - Get its two endpoint vertex coordinates (a0,a0y),(a1x,a1y).
 *   - For each other edge k that is occupied by the given player:
 *       if MathRoutines.isCrossing(a0x,a0y,a1x,a1y, b0x,b0y,b1x,b1y) → add k.
 *
 * TS: uses Trajectories.edgeEndpointPts(site) for Edge-play boards, or accesses
 * the core topology's edgeEls for Cell/Vertex-play boards (same pattern as
 * IsCrossing1to1.ts).
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Segment-crossing helper (same as IsCrossing1to1.ts)
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

/** Get [ax, ay, bx, by] for an edge by index. */
function getEdgePts(
  traj: Trajectories,
  edgeIdx: number,
): readonly [number, number, number, number] | undefined {
  // Edge-play board: edgeEndpointPts works directly.
  if (traj.kind === "Edge") {
    return traj.edgeEndpointPts(edgeIdx);
  }
  // Cell/Vertex-play: access core topology EdgeEl by graph edge index.
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

export class SitesCrossing1to1 implements RegionFunction {
  private readonly atFn: IntFunction;
  /** IntFunction returning the player/role index. */
  private readonly whoFn: IntFunction;

  /**
   * @java game/functions/region/sites/crossing/SitesCrossing.java — constructor
   */
  public constructor(atFn: IntFunction, whoFn: IntFunction) {
    this.atFn = atFn;
    this.whoFn = whoFn;
  }

  /**
   * @java game/functions/region/sites/crossing/SitesCrossing.java — eval(Context)
   */
  public eval(ctx: Context): number[] {
    const from = this.atFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return [];

    // @java SitesCrossing.java:64-65 — get kEdge and its endpoints
    const aPts = getEdgePts(traj, from);
    if (!aPts) return [];

    const [a0x, a0y, a1x, a1y] = aPts;
    const numPlayers = ctx.game.numPlayers;
    // @java SitesCrossing.java:72 — resolve whoSiteId
    const whoSiteId = this.whoFn.eval(ctx);
    const n = numEdges(traj);
    const result: number[] = [];

    for (let k = 0; k < n; k++) {
      if (k === from) continue;

      // @java SitesCrossing.java:93-97 — filter by ownership
      // whoSiteId == numPlayers+1 means "anyone occupied" (All/Every)
      const isOccupied = whoSiteId === numPlayers + 1
        ? ctx.state.whatAtSite(k) !== 0
        : ctx.state.cells[k] === whoSiteId;
      if (!isOccupied) continue;

      const bPts = getEdgePts(traj, k);
      if (!bPts) continue;
      const [b0x, b0y, b1x, b1y] = bPts;

      // @java MathRoutines.isCrossing(a0x,a0y,a1x,a1y,b0x,b0y,b1x,b1y)
      if (segmentsCross(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y)) {
        result.push(k);
      }
    }

    return result;
  }
}

// ---------------------------------------------------------------------------
// Factory + registration
// ---------------------------------------------------------------------------

/**
 * @java game/functions/region/sites/crossing/SitesCrossing.java
 * Registry key: "sites:crossing" —
 *   (sites Crossing at:<edge> (who:<Player> | role:<RoleType>))
 */
registerRegion1to1("sites:crossing", (node: LudNode, _env: Compile1to1Env): RegionFunction => {
  void _env;
  const { named } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);

  const atNode = named.get("at");
  if (!atNode) return { eval: () => [] };
  const atFn = compileInt1to1(atNode);

  // who: or role: → IntFunction resolving to player/role index
  const whoNode = named.get("who") ?? named.get("role");
  let whoFn: IntFunction;
  if (whoNode) {
    if (isIdent(whoNode)) {
      // RoleType ident: Mover → ctx.state.mover, Next → mover+1, P1→1, …
      const name = whoNode.name.toLowerCase();
      if (name === "mover") {
        whoFn = { eval: (ctx: Context) => ctx.state.mover };
      } else if (name === "next") {
        whoFn = { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
      } else if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
        const pid = parseInt(name.slice(1), 10);
        whoFn = { eval: () => pid };
      } else if (name === "all" || name === "shared" || name === "each") {
        // Treat as "anyone" — numPlayers+1 sentinel
        whoFn = { eval: (ctx: Context) => ctx.game.numPlayers + 1 };
      } else {
        whoFn = compileInt1to1(whoNode);
      }
    } else {
      whoFn = compileInt1to1(whoNode);
    }
  } else {
    // Default: anyone occupied (Java: whoSiteId == numPlayers+1 arm)
    whoFn = { eval: (ctx: Context) => ctx.game.numPlayers + 1 };
  }

  return new SitesCrossing1to1(atFn, whoFn);
});
