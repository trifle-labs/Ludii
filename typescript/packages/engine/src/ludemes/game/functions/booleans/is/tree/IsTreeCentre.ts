/**
 * IsTreeCentre.ts
 * @java game/functions/booleans/is/tree/IsTreeCentre.java
 *
 * Tests whether the last-placed vertex (ctx._evalTo) is the centre of the
 * induced spanning tree.
 *
 * Java eval (lines 53-155) does:
 *   1. Validate it's a tree (union-find, check no cycle).
 *   2. Build adjacency lists from coloured edges.
 *   3. Find the centre using a subtree-size DFS.
 *   4. Return true if siteId == centre, or both are degree-1 leaves, or
 *      they are adjacent and have the same depth limit.
 *
 * TS: mirrors the Java algorithm faithfully using Trajectories.edgeEndpoints.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import { Player } from "../../../../util/moves/Player.js";
import { isIdent } from "@ludii/typescript-language";

function findRoot(parent: number[], pos: number): number {
  while (parent[pos] !== pos) {
    parent[pos] = parent[parent[pos] as number] as number;
    pos = parent[pos] as number;
  }
  return pos;
}

function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx: Context & EvalScratch): number {
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "neutral") return 0;
      if (key === "shared" || key === "all" || key === "each") return ctx.game.numPlayers + 1;

      const playerMatch = /^p(\d+)$/.exec(key);
      if (playerMatch) return Number(playerMatch[1]);

      const teamMatch = /^team(\d+)$/.exec(key);
      if (teamMatch) return Number(teamMatch[1]);

      return ctx.state.mover;
    },
  };
}

/**
 * Read an edge's occupancy (who/what). @java IsTreeCentre.java:73-98 —
 * state.what(k, SiteType.Edge) routes to the EDGE container state. On a
 * Vertex-play board the edges live in the typed "Edge" channel (Ilpion's
 * (set Shared Edge (sites Board Edge)) put every edge there; the flat read
 * saw ZERO edges, every vertex was an isolated trivial tree-centre and
 * (addScore Mover 1) fired on every placement). On an Edge-play board the
 * flat channels ARE the edge channel.
 */
function edgeOcc(state: Context["state"], k: number): { w: number; who: number } {
  const st = state as unknown as {
    typedSites?: Map<string, unknown>;
    whoTyped?: (t: string, s: number) => number;
    whatTyped?: (t: string, s: number) => number;
    whatAtSite(s: number): number;
    who(s: number): number;
  };
  if (st.typedSites?.has("Edge") && st.whoTyped && st.whatTyped) {
    return { w: st.whatTyped("Edge", k), who: st.whoTyped("Edge", k) };
  }
  return { w: st.whatAtSite(k), who: st.who(k) };
}

/** Build adjacency sets from coloured edges. Returns Map<v, Set<v>>. */
function buildAdj(
  numVertices: number,
  numEdges: number,
  whoSiteId: number,
  numPlayers: number,
  state: Context["state"],
  traj: Trajectories,
): Map<number, Set<number>> {
  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < numVertices; i++) adj.set(i, new Set());

  for (let k = 0; k < numEdges; k++) {
    const { w, who } = edgeOcc(state, k);
    const isOwnedEdge =
      (whoSiteId === numPlayers + 1 && w !== 0) ||
      (whoSiteId <= numPlayers && who === whoSiteId);
    if (!isOwnedEdge) continue;
    const ep = traj.edgeEndpoints(k);
    if (!ep) continue;
    const [vA, vB] = ep;
    adj.get(vA)?.add(vB);
    adj.get(vB)?.add(vA);
  }
  return adj;
}

/** @java IsTreeCentre.java — dfs_subTreesGenerator */
function dfsSubtrees(u: number, parent: number, adj: Map<number, Set<number>>, sub: Map<number, Set<number>>): Set<number> {
  const s = new Set<number>();
  s.add(u);
  sub.set(u, s);
  for (const v of (adj.get(u) ?? [])) {
    if (v !== u && v !== parent) {
      const child = dfsSubtrees(v, u, adj, sub);
      for (const x of child) s.add(x);
    }
  }
  return s;
}

/** @java IsTreeCentre.java — dfsCenter */
function dfsCenter(u: number, parent: number, totalItems: number, adj: Map<number, Set<number>>, sub: Map<number, Set<number>>): number {
  for (const v of (adj.get(u) ?? [])) {
    if (v !== u && v !== parent) {
      const sz = sub.get(v)?.size ?? 0;
      if (sz > totalItems / 2) {
        return dfsCenter(v, u, totalItems, adj, sub);
      }
    }
  }
  return u;
}

/** @java IsTreeCentre.java — build (entry point to subtree/center search) */
function buildCenter(start: number, adj: Map<number, Set<number>>): number {
  const sub = new Map<number, Set<number>>();
  dfsSubtrees(start, -1, adj, sub);
  const total = sub.get(start)?.size ?? 0;
  return dfsCenter(start, -1, total, adj, sub);
}

/** @java IsTreeCentre.java — depthLimit */
function depthLimit(u: number, index: number, max: number, subTree: Set<number>, adj: Map<number, Set<number>>): number {
  subTree.delete(u);
  const newIndex = index + 1;
  let newMax = (newIndex > max) ? newIndex : max;
  if (subTree.size === 0) return newMax;
  for (const v of (adj.get(u) ?? [])) {
    if (subTree.has(v)) {
      return depthLimit(v, newIndex, newMax, subTree, adj);
    }
  }
  return newMax;
}

export class IsTreeCentre implements BooleanFunction {
  private readonly whoFn: IntFunction;

  /**
   * @java IsTreeCentre(@Or Player who, @Or RoleType role)
   */
  public constructor(who: Player | null, role: RoleTypeFull | null) {
    this.whoFn = (role !== null) ? roleToIntFunction(role) : who!.index();
  }

  /**
   * @java game/functions/booleans/is/tree/IsTreeCentre.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const siteId = ctx._evalTo;
    if (siteId < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    const whoSiteId = this.whoFn.eval(ctx);
    const numPlayers = ctx.game.numPlayers;
    const totalVertices = traj.vertexCount;
    // @java IsTreeCentre.java:73 — iterate the EDGE list, not the play-site
    // list (traj.numSites is the VERTEX count on a use:Vertex board — Ilpion
    // scanned 36 "edges" of a 35-edge graph).
    const numEdges = traj.edgeCount > 0 ? traj.edgeCount : traj.numSites;

    const adj = buildAdj(totalVertices, numEdges, whoSiteId, numPlayers, ctx.state, traj);

    // Validate it's actually a tree (union-find, cycle detection)
    const parent = new Array<number>(totalVertices);
    for (let i = 0; i < totalVertices; i++) parent[i] = i;
    for (let k = 0; k < numEdges; k++) {
      const { w, who } = edgeOcc(ctx.state, k);
      const isOwnedEdge =
        (whoSiteId === numPlayers + 1 && w !== 0) ||
        (whoSiteId <= numPlayers && who === whoSiteId);
      if (!isOwnedEdge) continue;
      const ep = traj.edgeEndpoints(k);
      if (!ep) continue;
      const aRoot = findRoot(parent, ep[0]);
      const bRoot = findRoot(parent, ep[1]);
      if (aRoot === bRoot) return false; // cycle → not a tree
      parent[aRoot] = bRoot;
    }

    // Find the component containing siteId
    // @java IsTreeCentre.java:101-116
    let componentStart = -1;
    for (let i = 0; i < totalVertices; i++) {
      if (findRoot(parent, i) === findRoot(parent, siteId) && adj.get(i)!.size > 0) {
        componentStart = i;
        break;
      }
    }
    if (componentStart < 0) {
      // siteId is isolated; trivially a one-node tree, it is the centre
      return true;
    }

    // @java IsTreeCentre.java:111 — centre = build(...)
    const centre = buildCenter(componentStart, adj);

    // @java IsTreeCentre.java:118 — siteId == centre
    if (siteId === centre) return true;

    // @java IsTreeCentre.java:121-126 — both degree 1 leaves
    const centreAdj = adj.get(centre)!;
    const siteAdj = adj.get(siteId)!;
    if (centreAdj.size === 1 && siteAdj.size === 1) return true;

    // @java IsTreeCentre.java:128-150 — adjacent with equal depth limit
    if (centreAdj.has(siteId)) {
      const subTree1 = new Set<number>();
      const subTree2 = new Set<number>();
      // collect all nodes in the component
      for (let i = 0; i < totalVertices; i++) {
        if (adj.get(i)!.size > 0) {
          subTree1.add(i);
          subTree2.add(i);
        }
      }
      const level1 = depthLimit(siteId, 0, 0, subTree1, adj);
      const level2 = depthLimit(centre, 0, 0, subTree2, adj);
      if (level1 === level2) return true;
    }

    return false;
  }
}

// Also register with American spelling "is:treecenter"
