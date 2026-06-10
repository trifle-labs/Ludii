/**
 * IsCaterpillarTree.ts
 * @java game/functions/booleans/is/tree/IsCaterpillarTree.java
 *
 * Tests whether the induced edge subgraph is a caterpillar tree:
 * a spanning tree where removing all leaf nodes leaves a path (the "spine").
 *
 * Java eval (lines 60-173) does:
 *   1. Union-find: verify it is a spanning tree (no cycle, exactly V-1 edges,
 *      exactly 1 root in union-find).
 *   2. Build a "caterpillarBackbone" bitset: edges where both endpoints have
 *      degree ≥ 2 (i.e. non-leaf edges).
 *   3. Run two DFS from the ends of the first backbone edge to count distinct
 *      paths.
 *   4. If the two path lengths sum to the backbone size (i.e. the backbone is
 *      a single path), it's a caterpillar.
 *
 * TS: mirrors Java faithfully. Works on Edge-play boards only (needs
 * Trajectories.edgeEndpoints).
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

type WhoArg = Player | IntFunction | null;

function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx: Context & EvalScratch): number {
      if (key === "neutral") return 0;
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return ctx.state.next || ((ctx.state.mover % ctx.game.numPlayers) + 1);
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "shared" || key === "all" || key === "each") return ctx.game.numPlayers + 1;

      const playerMatch = /^p(\d+)$/.exec(key);
      if (playerMatch) return Number(playerMatch[1]);

      const teamMatch = /^team(\d+)$/.exec(key);
      if (teamMatch) return Number(teamMatch[1]);

      if (key === "teammover") {
        const stateWithTeams = ctx.state as unknown as { getTeam?: (player: number) => number };
        return stateWithTeams.getTeam?.(ctx.state.mover) ?? ctx.state.mover;
      }

      return ctx.state.mover;
    },
  };
}

function whoToIntFunction(who: WhoArg): IntFunction {
  if (who instanceof Player) return who.index();
  if (who !== null && typeof who === "object" && "eval" in who && typeof who.eval === "function") return who;
  return new Player(null).index();
}

/**
 * @java IsCaterpillarTree.java — dfsMinPathEdge
 * DFS to find path length from presentVertex avoiding kEdge.
 * Returns bit-depth via depthBitset (Set<number>).
 */
function dfsMinPathEdge(
  edges: { va: number; vb: number }[],
  backboneSet: Set<number>,
  visitedEdge: Set<number>,
  index: number,
  presentVertex: number,
  parent: number,
  minComponentSz: number,
  depthBitset: Set<number>,
  skipEdgeIdx: number,
): number {
  if (index === minComponentSz * 2) return index;

  for (const k of backboneSet) {
    const e = edges[k]!;
    if (k === skipEdgeIdx) continue;

    if (e.va === presentVertex) {
      visitedEdge.add(k);
      dfsMinPathEdge(edges, backboneSet, visitedEdge, index + 1, e.vb, e.va, minComponentSz, depthBitset, k);
    } else if (e.vb === presentVertex) {
      visitedEdge.add(k);
      dfsMinPathEdge(edges, backboneSet, visitedEdge, index + 1, e.va, e.vb, minComponentSz, depthBitset, k);
    }
  }
  depthBitset.add(index);
  return index;
}

export class IsCaterpillarTree implements BooleanFunction {
  private readonly whoFn: IntFunction;

  /**
   * @java IsCaterpillarTree(Player who, RoleType role)
   */
  public constructor(who: WhoArg, role: RoleTypeFull | null) {
    this.whoFn = (role !== null) ? roleToIntFunction(role) : whoToIntFunction(who);
  }

  /**
   * @java game/functions/booleans/is/tree/IsCaterpillarTree.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const siteId = ctx._evalTo;
    if (siteId < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    let whoSiteId = this.whoFn.eval(ctx);
    if (whoSiteId === 0) {
      const w = ctx.state.whatAtSite(siteId);
      whoSiteId = (w === 0) ? 1 : w;
    }

    const totalVertices = traj.vertexCount;
    const totalEdges = traj.numSites;

    // @java IsCaterpillarTree.java:81-96: union-find + spanning tree check
    const parent = new Array<number>(totalVertices);
    for (let i = 0; i < totalVertices; i++) parent[i] = i;

    // Build edge list and check spanning tree
    const edgeList: { va: number; vb: number }[] = [];
    const ownedEdges: number[] = []; // indices of edges owned by whoSiteId
    let totalExistingEdges = 0;

    for (let k = 0; k < totalEdges; k++) {
      const ep = traj.edgeEndpoints(k);
      edgeList.push(ep ? { va: ep[0], vb: ep[1] } : { va: -1, vb: -1 });
      if (ctx.state.whatAtSite(k) === whoSiteId) {
        if (!ep) continue;
        const aRoot = findRoot(parent, ep[0]);
        const bRoot = findRoot(parent, ep[1]);
        if (aRoot === bRoot) return false; // cycle
        parent[aRoot] = bRoot;
        totalExistingEdges++;
        ownedEdges.push(k);
      }
    }

    // @java IsCaterpillarTree.java:98-99: check spanning tree
    if (totalExistingEdges !== (totalVertices - 1)) return false;

    // @java IsCaterpillarTree.java:101-109: exactly 1 root
    let rootCount = 0;
    for (let i = 0; i < totalVertices; i++) {
      if (findRoot(parent, i) === i) rootCount++;
    }
    if (rootCount !== 1) return false;

    // @java IsCaterpillarTree.java:111-159: compute degree, build backbone
    // degree[v] = number of owned edges incident to v
    const degree: number[] = new Array<number>(totalVertices).fill(0);
    for (const k of ownedEdges) {
      const e = edgeList[k]!;
      if (e.va >= 0) {
        degree[e.va] = (degree[e.va] ?? 0) + 1;
        degree[e.vb] = (degree[e.vb] ?? 0) + 1;
      }
    }

    // Backbone: edges where both endpoints have degree >= 2
    const caterpillarBackbone = new Set<number>();
    for (const k of ownedEdges) {
      const e = edgeList[k]!;
      if (e.va < 0) continue;
      if ((degree[e.va] ?? 0) >= 2 && (degree[e.vb] ?? 0) >= 2) {
        caterpillarBackbone.add(k);
      }
    }

    if (caterpillarBackbone.size === 0) {
      // A star graph (one centre, all leaves) is a valid caterpillar
      return true;
    }

    // @java IsCaterpillarTree.java:160-172: DFS path length check
    const firstBackboneEdgeIdx = caterpillarBackbone.values().next().value as number;
    const firstEdge = edgeList[firstBackboneEdgeIdx]!;
    const v1 = firstEdge.va;
    const v2 = firstEdge.vb;
    const componentSz = totalVertices;

    const depthBitset1 = new Set<number>();
    const depthBitset2 = new Set<number>();
    const visitedEdge1 = new Set<number>();
    const visitedEdge2 = new Set<number>();

    dfsMinPathEdge(edgeList, caterpillarBackbone, visitedEdge1, 0, v1, v2, componentSz, depthBitset1, firstBackboneEdgeIdx);
    dfsMinPathEdge(edgeList, caterpillarBackbone, visitedEdge2, 0, v2, v1, componentSz, depthBitset2, firstBackboneEdgeIdx);

    const pathLength = (depthBitset1.size - 1) + (depthBitset2.size - 1) + 1;
    return pathLength === caterpillarBackbone.size;
  }
}

