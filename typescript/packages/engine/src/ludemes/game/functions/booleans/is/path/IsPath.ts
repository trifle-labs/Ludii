// @java Core/src/game/functions/booleans/is/path/IsPath.java

/**
 * Faithful port of Java IsPath.java (1150 lines).
 *
 * (is Path <SiteType> <Role> length:(<range>) closed:<bool>)
 *
 * Dispatches to evalEdge / evalVertex / evalCell based on the site type.
 * Each mode runs a modified Tarjan SCC to detect connected components
 * in the subgraph of elements owned by the given player, then tests
 * whether the component containing the `from` site (default: last-To)
 * satisfies the length range and open/closed requirement.
 *
 * Java parity: IsPath.java eval @line 94-111, evalEdge @line 121-232,
 * evalCell @line 241-392, evalVertex @line 401-535,
 * strongComponent @line 559-659, findShortestDistance @line 677-729,
 * dfsMinCycleSzVertexCell @line 749-828, dfsMinPathEdge @line 848-889,
 * dfsMinPathSzVertexCell @line 906-955,
 * vertexToAdjacentNeighbourVertices @line 966-994 (Edge adjacency),
 * vertexToAdjacentNeighbourVertices1 @line 1005-1027 (Vertex adjacency).
 */

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  type CompileEnv,
  lastToSite,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
  IntFn,
} from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const INFINITY = 1_000_000_000; // Java Constants.INFINITY

// ---------------------------------------------------------------------------
// Compile
// ---------------------------------------------------------------------------

export function compileIsPath(node: LudList, env: CompileEnv): BoolFn {
  // (is Path <SiteType> <Role|Player> length:<rangeNode> closed:<boolNode>)
  // Items: [0]="is", [1]="Path", [2...]=args
  const { positional, named } = parseArgs(node.items.slice(2));

  // 1. SiteType — first ident that is Cell/Vertex/Edge
  let siteType: "Cell" | "Vertex" | "Edge" = "Cell";
  let roleNode: LudNode | undefined;

  for (const p of positional) {
    if (isIdent(p)) {
      if (p.name === "Cell" || p.name === "Vertex" || p.name === "Edge") {
        siteType = p.name;
      } else {
        // First non-type ident is the role (Mover, P1, Next, …)
        if (!roleNode) roleNode = p;
      }
    } else if (isList(p)) {
      // (player index) form
      if (!roleNode) roleNode = p;
    }
  }

  // 2. who: player IntFn (defaults to Mover)
  // Java: this.who = (who == null) ? RoleType.toIntFunction(role) : who.index()
  //       where bare role "Mover" → compiles to context.mover
  const whoFn: IntFn = roleNode
    ? compileInt(roleNode, env)
    : { eval: (ctx) => ctx.mover };

  // 3. from: defaults to (last To)
  // Java: this.from = (from != null) ? from : new LastTo(null)
  const fromNode = named.get("from");
  const fromFn: IntFn = fromNode
    ? compileInt(fromNode, env)
    : { eval: (ctx) => lastToSite(ctx) };

  // 4. range: length:(<rangeNode>) — (exact N) / (range A B) / (max N) / (min N)
  const lengthNode = named.get("length");
  const { minFn, maxFn } = parseRangeFns(lengthNode, env);

  // 5. closed: boolean (default false)
  // Java: closedFlagFn = (closed == null) ? new BooleanConstant(false) : closed
  const closedNode = named.get("closed");
  const closedFn: BoolFn = closedNode
    ? compileBool(closedNode, env)
    : { eval: () => false };

  return {
    eval: (ctx) => {
      const siteId = fromFn.eval(ctx);
      // Java: if(siteId == Constants.OFF) return false;
      if (siteId === OFF || siteId < 0) return false;

      switch (siteType) {
        case "Vertex":
          return evalVertex(ctx, siteId, whoFn, minFn, maxFn, closedFn);
        case "Edge":
          return evalEdge(ctx, siteId, whoFn, minFn, maxFn, closedFn);
        case "Cell":
          return evalCell(ctx, siteId, whoFn, minFn, maxFn, closedFn);
        default:
          return false;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// evalEdge — Java IsPath.evalEdge @line 121-232
// ---------------------------------------------------------------------------

function evalEdge(
  ctx: EvalContext,
  siteId: number,
  whoFn: IntFn,
  minFn: IntFn,
  maxFn: IntFn,
  closedFn: BoolFn,
): boolean {
  const traj = ctx.board.traj;
  if (!traj) return false;

  const whoSiteId = whoFn.eval(ctx);
  const totalEdges = traj.numSites;
  const totalVertices = traj.vertexCount;
  const minLength = minFn.eval(ctx);
  const maxLength = maxFn.eval(ctx);

  // Java: kEdge.vA().index() / kEdge.vB().index()
  const endpoints = traj.edgeEndpoints(siteId);
  if (!endpoints) return false;
  const v1 = endpoints[0];
  const v2 = endpoints[1];

  const disc = new Array<number>(totalVertices).fill(0);
  const low = new Array<number>(totalVertices).fill(0);
  const stackMember = new Array<boolean>(totalVertices).fill(false);
  const stack: number[] = [];
  const testBitset = new Array<boolean>(totalVertices).fill(false);

  // Java strongComponent(context, startingVertex=v1, parent=-1, ...)
  const strongComponents = strongComponent(
    ctx, v1, -1, disc, low, stack, stackMember, testBitset,
    whoSiteId, 1, totalVertices, v1, v2, "Edge", totalEdges,
  );

  const closedFlag = closedFn.eval(ctx);

  if (closedFlag) {
    // Build adjacencyGraph (vertex→vertex through owned edges) and edgeBitset
    // (owned edges whose both endpoints are in testBitset).
    // Java lines 151-192
    const adjacencyGraph: Set<number>[] = [];
    for (let i = 0; i < totalVertices; i++) adjacencyGraph.push(new Set<number>());
    const edgeInScc: boolean[] = new Array<boolean>(totalEdges).fill(false);

    for (let i = 0; i < totalEdges; i++) {
      if (edgeOwner(ctx, i) !== whoSiteId) continue;
      const ep = traj.edgeEndpoints(i);
      if (!ep) continue;
      const vA = ep[0];
      const vB = ep[1];
      adjacencyGraph[vA]!.add(vB);
      adjacencyGraph[vB]!.add(vA);
      if (testBitset[vA] && testBitset[vB]) {
        edgeInScc[i] = true;
      }
    }

    const edgeBitsetCount = edgeInScc.filter(Boolean).length;

    // Java: if (minLength == maxLength) { if (strongComponents == edgeBitsetCount && strongComponents == minLength) return true; }
    if (minLength === maxLength) {
      if (strongComponents === edgeBitsetCount && strongComponents === minLength)
        return true;
    } else if (maxLength > 2 && strongComponents <= maxLength) {
      if (strongComponents === edgeBitsetCount && strongComponents > 2)
        return true;
    }

    // Java lines 174-192: if edgeBitsetCount > strongComponents, try BFS shortest path
    if (edgeBitsetCount > strongComponents) {
      const path = findShortestDistance(traj, adjacencyGraph, v1, v2, totalVertices);
      let i = v2;
      let minDepth = 1;
      while (path[i] !== i) {
        minDepth++;
        i = path[i]!;
      }

      if (minLength === maxLength) {
        if (minDepth === minLength) return true;
      }
      if (maxLength > 2) {
        if (minDepth <= maxLength) return true;
      }
    }
  } else {
    // Open path — Java lines 196-229
    // If strongComponents != 0, there is a cycle → not a simple path
    if (strongComponents !== 0) return false;

    // Collect all owned edges into edgeBitset (set of edge indices)
    const ownedEdges: boolean[] = new Array<boolean>(totalEdges).fill(false);
    for (let i = 0; i < totalEdges; i++) {
      if (edgeOwner(ctx, i) === whoSiteId) {
        ownedEdges[i] = true;
      }
    }

    const componentSz = minLength === maxLength ? minLength : maxLength;

    // Java dfsMinPathEdge from v1 (going away from v2) and from v2 (going away from v1).
    // Java lines 217-218: BOTH calls share the same visitedEdge BitSet.
    const depthBitset1 = new Array<boolean>(componentSz * 2 + 2).fill(false);
    const depthBitset2 = new Array<boolean>(componentSz * 2 + 2).fill(false);
    const visitedEdge = new Array<boolean>(totalEdges).fill(false);

    dfsMinPathEdge(ctx, siteId, ownedEdges, visitedEdge, 0, v1, v2, componentSz, depthBitset1, traj);
    dfsMinPathEdge(ctx, siteId, ownedEdges, visitedEdge, 0, v2, v1, componentSz, depthBitset2, traj);

    // Java: pathLength = (depthBitset1.cardinality()-1) + (depthBitset2.cardinality()-1) + 1
    const card1 = depthBitset1.filter(Boolean).length;
    const card2 = depthBitset2.filter(Boolean).length;
    const pathLength = (card1 - 1) + (card2 - 1) + 1;
    // Java line 220: visitedEdge.cardinality() — uses the shared visited set
    const visitedCount = visitedEdge.filter(Boolean).length;

    if (minLength === maxLength) {
      if (pathLength === minLength && visitedCount + 1 === pathLength)
        return true;
    }

    if (maxLength > minLength) {
      if (pathLength <= maxLength && visitedCount + 1 === pathLength)
        return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// evalVertex — Java IsPath.evalVertex @line 401-535
// ---------------------------------------------------------------------------

function evalVertex(
  ctx: EvalContext,
  siteId: number,
  whoFn: IntFn,
  minFn: IntFn,
  maxFn: IntFn,
  closedFn: BoolFn,
): boolean {
  const traj = ctx.board.traj;
  if (!traj) return false;

  const whoSiteId = whoFn.eval(ctx);
  // For vertex play, numSites == number of vertices
  const totalVertices = traj.numSites;
  const totalEdges = traj.vertexCount; // not really used, just for array bounds
  const minLength = minFn.eval(ctx);
  const maxLength = maxFn.eval(ctx);
  const closedFlag = closedFn.eval(ctx);

  const v1 = siteId;
  let v2 = 0;
  let isolated = true;

  // Java: find first owned adjacent neighbour (vertex adjacency via vertex graph)
  // Java lines 424-436: for each vertex in kVertex.adjacent(), check if owned
  const adjVerts = vertexToAdjacentNeighbourVertices1(ctx, v1, whoSiteId, traj);
  if (adjVerts.length > 0) {
    v2 = adjVerts[0]!;
    isolated = false;
  }

  // Java lines 438-443
  if (isolated && closedFlag) return false;
  if (isolated && !closedFlag) {
    if (minLength === 1 || maxLength === 1) return true;
  }

  const disc = new Array<number>(totalVertices).fill(0);
  const low = new Array<number>(totalVertices).fill(0);
  const stackMember = new Array<boolean>(totalVertices).fill(false);
  const stack: number[] = [];
  const testBitset = new Array<boolean>(totalVertices).fill(false);

  const strongComponents = strongComponent(
    ctx, v1, -1, disc, low, stack, stackMember, testBitset,
    whoSiteId, 1, totalVertices, v1, v2, "Vertex", 0,
  );

  if (closedFlag) {
    // Java lines 452-489
    if (minLength === maxLength) {
      if (strongComponents === minLength) return true;

      if (strongComponents > minLength) {
        // Try to find a cycle of exactly minLength containing v1
        const nListVertex = vertexToAdjacentNeighbourVertices1(ctx, v1, whoSiteId, traj);
        const vertexIndex = new Array<number>(totalVertices).fill(0);
        const vertexVisit = new Array<number>(totalVertices).fill(0);
        for (const neighbour of nListVertex) {
          const minDepth = dfsMinCycleSzVertexCell(
            ctx, vertexVisit, vertexIndex, 1, v1, neighbour, -1, INFINITY, whoSiteId, "Vertex", traj,
          );
          if (minDepth === minLength && minDepth > 2) return true;
        }
      }
    } else if (maxLength > minLength) {
      // Java lines 472-489
      if (strongComponents <= maxLength && strongComponents > 2) return true;

      if (strongComponents > maxLength) {
        const nListVertex = vertexToAdjacentNeighbourVertices1(ctx, v1, whoSiteId, traj);
        const vertexIndex = new Array<number>(totalVertices).fill(0);
        const vertexVisit = new Array<number>(totalVertices).fill(0);
        for (const neighbour of nListVertex) {
          const minDepth = dfsMinCycleSzVertexCell(
            ctx, vertexVisit, vertexIndex, 1, v1, neighbour, -1, INFINITY, whoSiteId, "Vertex", traj,
          );
          if (minDepth <= maxLength && minDepth > 2) return true;
        }
      }
    }
  } else {
    // Open path — Java lines 491-533
    if (strongComponents !== 0) return false;
    if (maxLength > minLength) return true; // range: any path works

    const nListVertex = vertexToAdjacentNeighbourVertices1(ctx, v1, whoSiteId, traj);
    if (nListVertex.length > 2 || nListVertex.length < 1) return false;

    if (minLength === maxLength) {
      let pathSize = 0;
      if (nListVertex.length === 1) {
        // Java: dfsMinPathSzVertexCell(context, 0, kVertex.index(), v1, -1, minLength, whoSiteId) + 1
        pathSize = dfsMinPathSzVertexCell(ctx, 0, v1, v1, -1, minLength, whoSiteId, "Vertex", traj) + 1;
      }
      if (pathSize === minLength) return true;

      let pathSize1 = 0;
      let pathSize2 = 0;
      if (nListVertex.length === 2) {
        pathSize1 = dfsMinPathSzVertexCell(ctx, 1, v1, nListVertex[0]!, -1, minLength, whoSiteId, "Vertex", traj);
        pathSize2 = dfsMinPathSzVertexCell(ctx, 1, v1, nListVertex[1]!, nListVertex[0]!, minLength, whoSiteId, "Vertex", traj);
        const pathTotal = pathSize1 + pathSize2 + 1;
        if (pathTotal === minLength) return true;
      }
    }
    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// evalCell — Java IsPath.evalCell @line 241-392
// ---------------------------------------------------------------------------

function evalCell(
  ctx: EvalContext,
  siteId: number,
  whoFn: IntFn,
  minFn: IntFn,
  maxFn: IntFn,
  closedFn: BoolFn,
): boolean {
  const traj = ctx.board.traj;
  // For cell play we can also use flat board adjacency
  // Use ctx.board.topo for flat boards, traj for graph boards
  const totalCells = traj ? traj.numSites : ctx.board.topo.cells.length;

  const whoSiteId = whoFn.eval(ctx);
  const minLength = minFn.eval(ctx);
  const maxLength = maxFn.eval(ctx);
  const closedFlag = closedFn.eval(ctx);

  const v1 = siteId;
  let v2 = 0;
  let isolated = true;

  // Java lines 262-275: find first owned adjacent cell
  const adjCells = cellAdjacent(ctx, v1, whoSiteId, traj);
  if (adjCells.length > 0) {
    v2 = adjCells[0]!;
    isolated = false;
  }

  // Java lines 276-281
  if (isolated && closedFlag) return false;
  if (isolated && !closedFlag) {
    if (minLength === 1 && maxLength === 1) return true;
  }

  const disc = new Array<number>(totalCells).fill(0);
  const low = new Array<number>(totalCells).fill(0);
  const stackMember = new Array<boolean>(totalCells).fill(false);
  const stack: number[] = [];
  const testBitset = new Array<boolean>(totalCells).fill(false);

  const strongComponents = strongComponent(
    ctx, v1, -1, disc, low, stack, stackMember, testBitset,
    whoSiteId, 1, totalCells, v1, v2, "Cell", 0,
  );

  if (closedFlag) {
    // Java lines 290-348
    if (minLength === maxLength) {
      if (strongComponents === minLength) return true;

      if (minLength < strongComponents) {
        const nList2 = cellAdjacent(ctx, v1, whoSiteId, traj);
        const vertexIndex = new Array<number>(totalCells).fill(0);
        const vertexVisit = new Array<number>(totalCells).fill(0);
        for (const neighbour of nList2) {
          const minDepth = dfsMinCycleSzVertexCell(
            ctx, vertexVisit, vertexIndex, 1, v1, neighbour, -1, INFINITY, whoSiteId, "Cell", traj,
          );
          if (minDepth === minLength && minDepth > 2) return true;
        }
      }
    } else if (maxLength !== 0) {
      // Java lines 321-348
      if (strongComponents <= maxLength && strongComponents > 2) return true;

      if (strongComponents > maxLength) {
        const nList2 = cellAdjacent(ctx, v1, whoSiteId, traj);
        const vertexIndex = new Array<number>(totalCells).fill(0);
        const vertexVisit = new Array<number>(totalCells).fill(0);
        for (const neighbour of nList2) {
          const minDepth = dfsMinCycleSzVertexCell(
            ctx, vertexVisit, vertexIndex, 1, v1, neighbour, -1, INFINITY, whoSiteId, "Cell", traj,
          );
          if (minDepth <= maxLength && minDepth > 2) return true;
        }
      }
    }
  } else {
    // Open path — Java lines 350-391
    if (strongComponents !== 0) return false;
    if (maxLength > 0) return true; // range

    const nListVertex = cellAdjacent(ctx, v1, whoSiteId, traj);
    if (nListVertex.length > 2 || nListVertex.length < 1) return false;

    let pathSize1 = 0;

    if (nListVertex.length === 1) {
      pathSize1 = dfsMinPathSzVertexCell(ctx, 0, v1, v1, -1, minLength, whoSiteId, "Cell", traj) + 1;
    }
    if (pathSize1 === minLength) return true;

    let pathSize2 = 0;
    if (nListVertex.length === 2) {
      pathSize1 = dfsMinPathSzVertexCell(ctx, 1, v1, nListVertex[0]!, -1, minLength, whoSiteId, "Cell", traj);
      pathSize2 = dfsMinPathSzVertexCell(ctx, 1, v1, nListVertex[1]!, nListVertex[0]!, minLength, whoSiteId, "Cell", traj);
      const pathSize = pathSize1 + pathSize2 + 1;
      if (pathSize === minLength) return true;
    }

    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// strongComponent — Java IsPath.strongComponent @line 559-659
//
// Modified Tarjan SCC. Returns the size of the SCC containing BOTH v1 and v2,
// or 0 if they are not in the same SCC. Also fills testBitset with the SCC
// members.
// ---------------------------------------------------------------------------

function strongComponent(
  ctx: EvalContext,
  presentPosition: number,
  parent: number,
  visit: number[],
  low: number[],
  stackInfo: number[],
  stackInfoBitset: boolean[],
  testBitset1: boolean[],
  whoSiteId: number,
  index: number,
  _totalItems: number,
  v1: number,
  v2: number,
  mode: "Vertex" | "Edge" | "Cell",
  totalEdges: number,
): number {
  // Java lines 579-583
  visit[presentPosition] = index;
  low[presentPosition] = index;
  stackInfo.push(presentPosition);
  stackInfoBitset[presentPosition] = true;

  // Build neighbour list in vertex-space
  // Java lines 585-609: different per mode
  const nList = getVertexNeighbours(ctx, presentPosition, whoSiteId, mode, totalEdges);

  for (const v of nList) {
    if (v === parent) continue;

    if (visit[v] === 0) {
      strongComponent(ctx, v, presentPosition, visit, low, stackInfo, stackInfoBitset, testBitset1, whoSiteId, index + 1, _totalItems, v1, v2, mode, totalEdges);
      low[presentPosition] = Math.min(low[presentPosition]!, low[v]!);
    } else {
      if (stackInfoBitset[v]) {
        low[presentPosition] = Math.min(low[presentPosition]!, visit[v]!);
      }
    }
  }

  // Pop SCC if this is a root — Java lines 633-657
  const testBitset: boolean[] = new Array<boolean>(_totalItems).fill(false);
  if (low[presentPosition] === visit[presentPosition]) {
    while (stackInfo[stackInfo.length - 1] !== presentPosition) {
      const w = stackInfo.pop()!;
      stackInfoBitset[w] = false;
      testBitset[w] = true;
    }
    const w = stackInfo.pop()!;
    stackInfoBitset[w] = false;
    testBitset[w] = true;
  }

  // Java lines 650-658: if the SCC contains both v1 and v2, record it
  if (testBitset[v1] && testBitset[v2]) {
    for (let i = 0; i < testBitset.length; i++) {
      if (testBitset[i]) testBitset1[i] = true;
    }
    return testBitset.filter(Boolean).length;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// findShortestDistance — Java IsPath.findShortestDistance @line 677-729
//
// BFS (Dijkstra with unit weights) to find the shortest path in the adjacency
// graph from `from` to `to`, excluding the direct edge between them.
// Returns the parent array.
// ---------------------------------------------------------------------------

function findShortestDistance(
  traj: { edgeEndpoints: (i: number) => readonly [number, number] | undefined; numSites: number },
  adjacencyGraph: Set<number>[],
  from: number,
  to: number,
  totalVertices: number,
): number[] {
  const dist = new Array<number>(totalVertices).fill(INFINITY);
  const path = new Array<number>(totalVertices);
  for (let i = 0; i < totalVertices; i++) path[i] = i;

  // Find the direct edge from→to to exclude (Java: graph.findEdge(to, from))
  // We exclude any single edge that directly connects `from` and `to`
  let directEdgeIdx = -1;
  for (let e = 0; e < traj.numSites; e++) {
    const ep = traj.edgeEndpoints(e);
    if (!ep) continue;
    if ((ep[0] === from && ep[1] === to) || (ep[0] === to && ep[1] === from)) {
      directEdgeIdx = e;
      break;
    }
  }

  const visited = new Array<boolean>(totalVertices).fill(false);
  // Simple BFS (all weights=1, so BFS = Dijkstra)
  const queue: number[] = [from];
  dist[from] = 0;

  while (queue.length > 0) {
    // Priority-queue dequeue: just shift (small graphs)
    queue.sort((a, b) => (dist[a] ?? INFINITY) - (dist[b] ?? INFINITY));
    const u = queue.shift()!;

    if (u === to) return path;
    if (visited[u]) continue;
    visited[u] = true;

    for (const v of (adjacencyGraph[u] ?? [])) {
      // Java: skip the direct edge kEdge between `to` and `from`
      // Java does: final Edge uv = graph.findEdge(v, u); if(uv == kEdge) continue;
      // We skip if (u,v) is the direct edge from→to
      if (directEdgeIdx >= 0) {
        const ep = traj.edgeEndpoints(directEdgeIdx);
        if (ep && ((ep[0] === u && ep[1] === v) || (ep[0] === v && ep[1] === u))) {
          continue;
        }
      }
      const newDist = (dist[u] ?? INFINITY) + 1;
      if (newDist < (dist[v] ?? INFINITY)) {
        dist[v] = newDist;
        path[v] = u;
        queue.push(v);
      }
    }
  }
  return path;
}

// ---------------------------------------------------------------------------
// dfsMinCycleSzVertexCell — Java IsPath.dfsMinCycleSzVertexCell @line 749-828
//
// DFS to find the minimum cycle size through `startingVertex` in the owned
// subgraph. Returns the minimum cycle depth (number of vertices in the cycle).
// ---------------------------------------------------------------------------

function dfsMinCycleSzVertexCell(
  ctx: EvalContext,
  vertexVisit: number[],
  vertexIndex: number[],
  index: number,
  startingVertex: number,
  presentVertex: number,
  parent: number,
  minDepth: number,
  whoSiteId: number,
  mode: "Vertex" | "Cell",
  traj: ReturnType<typeof getTrajectories> | undefined,
): number {
  // Java lines 769-773
  vertexVisit[presentVertex] = (vertexVisit[presentVertex] ?? 0) + 1;
  // Java: presentDegree = graph.vertices().get(presentVertex).adjacent().size()
  // In vertex mode this is all adjacent vertices (not filtered by owner).
  // In cell mode it is all adjacent cells.
  // The degree is used as a visit cap to avoid infinite recursion.
  // We approximate by using degree in the full topology (not owner-filtered).
  let presentDegree: number;
  if (mode === "Vertex" && traj) {
    presentDegree = traj.group(presentVertex, "Adjacent").length || 1;
  } else if (mode === "Cell" && traj) {
    presentDegree = traj.group(presentVertex, "Orthogonal").length || 1;
  } else {
    presentDegree = 6; // fallback
  }

  if ((vertexVisit[presentVertex] ?? 0) > presentDegree) return index;
  if (minDepth === 3) return minDepth; // Java: if(minDepth == 3) return minDepth

  let newindex = index;
  let newMinDepth = minDepth;

  if ((vertexIndex[presentVertex] ?? 0) === 0) {
    vertexIndex[presentVertex] = index;
    newindex = index;
  } else {
    newindex = vertexIndex[presentVertex]!;
  }

  if (startingVertex === presentVertex) {
    if (minDepth > index) {
      newMinDepth = index;
      return newMinDepth + 1;
    }
  }

  const nList = mode === "Vertex"
    ? vertexToAdjacentNeighbourVertices1(ctx, presentVertex, whoSiteId, traj)
    : cellAdjacent(ctx, presentVertex, whoSiteId, traj);

  if (mode === "Cell") {
    for (const iVertex of nList) {
      if (iVertex !== parent) {
        dfsMinCycleSzVertexCell(
          ctx, vertexVisit, vertexIndex, newindex + 1, startingVertex, iVertex,
          presentVertex, newMinDepth, whoSiteId, mode, traj,
        );
      }
    }
  } else {
    // Java lines 813-825: vertex mode
    for (const ni of nList) {
      if (newindex === 1 && ni !== startingVertex) {
        if (presentVertex !== ni) {
          dfsMinCycleSzVertexCell(
            ctx, vertexVisit, vertexIndex, newindex + 1, startingVertex, ni,
            presentVertex, newMinDepth, whoSiteId, mode, traj,
          );
        }
      }
    }
  }

  return newindex + 1;
}

// ---------------------------------------------------------------------------
// dfsMinPathEdge — Java IsPath.dfsMinPathEdge @line 848-889
//
// DFS traversal to find path length through owned edges. Walks from
// `presentVertex` away from `parent`, accumulating depth in depthBitset.
// ---------------------------------------------------------------------------

function dfsMinPathEdge(
  ctx: EvalContext,
  kEdgeIdx: number,
  ownedEdges: boolean[],
  visitedEdge: boolean[],
  index: number,
  presentVertex: number,
  parent: number,
  mincomponentsz: number,
  depthBitset: boolean[],
  traj: ReturnType<typeof getTrajectories>,
): number {
  if (!traj) {
    depthBitset[index] = true;
    return index;
  }
  // Java: if(index == mincomponentsz * 2) return index
  if (index === mincomponentsz * 2) return index;

  for (let i = 0; i < ownedEdges.length; i++) {
    if (!ownedEdges[i]) continue;
    if (i === kEdgeIdx) continue; // skip the last-played edge

    const ep = traj.edgeEndpoints(i);
    if (!ep) continue;
    const nVA = ep[0];
    const nVB = ep[1];

    if (nVA === presentVertex) {
      visitedEdge[i] = true;
      dfsMinPathEdge(ctx, kEdgeIdx, ownedEdges, visitedEdge, index + 1, nVB, nVA, mincomponentsz, depthBitset, traj);
    } else if (nVB === presentVertex) {
      visitedEdge[i] = true;
      dfsMinPathEdge(ctx, kEdgeIdx, ownedEdges, visitedEdge, index + 1, nVA, nVB, mincomponentsz, depthBitset, traj);
    }
  }

  depthBitset[index] = true;
  return index;
}

// ---------------------------------------------------------------------------
// dfsMinPathSzVertexCell — Java IsPath.dfsMinPathSzVertexCell @line 906-955
//
// DFS to measure the length of the path through the owned vertex/cell subgraph.
// ---------------------------------------------------------------------------

function dfsMinPathSzVertexCell(
  ctx: EvalContext,
  index: number,
  startingVertex: number,
  presentVertex: number,
  parent: number,
  mincomponentsz: number,
  whoSiteId: number,
  mode: "Vertex" | "Cell",
  traj: ReturnType<typeof getTrajectories> | undefined,
): number {
  if (index === mincomponentsz * 2) return index;

  const nListVertex = mode === "Vertex"
    ? vertexToAdjacentNeighbourVertices1(ctx, presentVertex, whoSiteId, traj)
    : cellAdjacent(ctx, presentVertex, whoSiteId, traj);

  if (nListVertex.length > 2) return INFINITY;
  if (nListVertex.length === 0) return index;

  for (const nb of nListVertex) {
    if (nb !== parent && nb !== startingVertex) {
      return dfsMinPathSzVertexCell(ctx, index + 1, startingVertex, nb, presentVertex, mincomponentsz, whoSiteId, mode, traj);
    }
  }

  return index;
}

// ---------------------------------------------------------------------------
// Adjacency helpers
// ---------------------------------------------------------------------------

/**
 * vertexToAdjacentNeighbourVertices — Java @line 966-994
 * For Edge mode: returns vertex neighbours of `v` via OWNED edges.
 */
function vertexToAdjacentNeighbourVerticesEdge(
  ctx: EvalContext,
  v: number,
  whoSiteId: number,
  traj: ReturnType<typeof getTrajectories>,
): number[] {
  if (!traj) return [];
  const totalEdges = traj.numSites;
  const nList: number[] = [];
  for (let k = 0; k < totalEdges; k++) {
    if (edgeOwner(ctx, k) !== whoSiteId) continue;
    const ep = traj.edgeEndpoints(k);
    if (!ep) continue;
    if (ep[0] === v) nList.push(ep[1]);
    else if (ep[1] === v) nList.push(ep[0]);
  }
  return nList;
}

/**
 * vertexToAdjacentNeighbourVertices1 — Java @line 1005-1027
 * For Vertex mode: returns vertex neighbours of `v` via the graph's vertex
 * adjacency list, filtered to owned vertices.
 */
function vertexToAdjacentNeighbourVertices1(
  ctx: EvalContext,
  v: number,
  whoSiteId: number,
  traj: ReturnType<typeof getTrajectories> | undefined,
): number[] {
  const nList: number[] = [];
  if (traj) {
    // Use traj.group to get all adjacent vertices (Adjacent = all graph neighbours)
    const adj = traj.group(v, "Adjacent");
    for (const nb of adj) {
      if (nb !== v && ctx.state.whatAtSite(nb) === whoSiteId) {
        nList.push(nb);
      }
    }
  } else {
    // Flat board: orthogonal neighbours
    const adj = ctx.board.topo.orthogonalNeighbours(v);
    for (const nb of adj) {
      if (ctx.state.whatAtSite(nb) === whoSiteId) {
        nList.push(nb);
      }
    }
  }
  return nList;
}

/**
 * cellAdjacent: returns adjacent cells owned by `whoSiteId`.
 * Java evalCell uses kCell.adjacent() for cells.
 */
function cellAdjacent(
  ctx: EvalContext,
  v: number,
  whoSiteId: number,
  traj: ReturnType<typeof getTrajectories> | undefined,
): number[] {
  const nList: number[] = [];
  if (traj) {
    const adj = traj.group(v, "Orthogonal");
    for (const nb of adj) {
      if (nb !== v && ctx.state.whatAtSite(nb) === whoSiteId) {
        nList.push(nb);
      }
    }
  } else {
    const adj = ctx.board.topo.orthogonalNeighbours(v);
    for (const nb of adj) {
      if (ctx.state.whatAtSite(nb) === whoSiteId) {
        nList.push(nb);
      }
    }
  }
  return nList;
}

/**
 * Get vertex-space neighbours for strongComponent: depends on mode.
 * Java lines 585-609.
 */
function getVertexNeighbours(
  ctx: EvalContext,
  v: number,
  whoSiteId: number,
  mode: "Vertex" | "Edge" | "Cell",
  totalEdges: number,
): number[] {
  const traj = ctx.board.traj;
  if (mode === "Edge") {
    // vertexToAdjacentNeighbourVertices: via owned edges
    if (!traj) return [];
    return vertexToAdjacentNeighbourVerticesEdge(ctx, v, whoSiteId, traj);
  } else if (mode === "Vertex") {
    // vertexToAdjacentNeighbourVertices1: via vertex topology
    return vertexToAdjacentNeighbourVertices1(ctx, v, whoSiteId, traj);
  } else {
    // Cell: via adjacent() cells
    return cellAdjacent(ctx, v, whoSiteId, traj);
  }
}

/** Owner of an edge site (Java: state.who(i, Edge)). */
function edgeOwner(ctx: EvalContext, edgeIdx: number): number {
  return ctx.state.whatAtSite(edgeIdx);
}

/** Type-only alias to avoid importing Trajectories */
type TrajectoryLike = NonNullable<EvalContext["board"]["traj"]>;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
// Workaround: just use the traj type directly
function getTrajectories(ctx: EvalContext) { return ctx.board.traj; }

// ---------------------------------------------------------------------------
// Range parser — mimics Java RangeFunction (min=max for exact, etc.)
// ---------------------------------------------------------------------------

const RANGE_MAX_DEFAULT = 1_000_000_000;

function parseRangeFns(
  lengthNode: LudNode | undefined,
  env: CompileEnv,
): { minFn: IntFn; maxFn: IntFn } {
  const def = {
    minFn: { eval: () => 0 } as IntFn,
    maxFn: { eval: () => RANGE_MAX_DEFAULT } as IntFn,
  };
  if (!lengthNode) return def;

  // lengthNode is the node after "length:" key
  // It should be a list like (exact N) / (range A B) / (max N) / (min N)
  if (!isList(lengthNode)) {
    // Could be a bare number
    const fn = compileInt(lengthNode, env);
    return { minFn: fn, maxFn: fn };
  }
  const head = listHead(lengthNode);
  if (head === "exact") {
    const n = lengthNode.items[1];
    if (!n) return def;
    const fn = compileInt(n, env);
    return { minFn: fn, maxFn: fn };
  }
  if (head === "range") {
    const a = lengthNode.items[1];
    const b = lengthNode.items[2];
    if (!a) return def;
    const minFn = compileInt(a, env);
    return { minFn, maxFn: b ? compileInt(b, env) : minFn };
  }
  if (head === "max") {
    const a = lengthNode.items[1];
    return a ? { minFn: def.minFn, maxFn: compileInt(a, env) } : def;
  }
  if (head === "min") {
    const a = lengthNode.items[1];
    return a ? { minFn: compileInt(a, env), maxFn: def.maxFn } : def;
  }
  return def;
}

register("bool", "Path", compileIsPath as any);
