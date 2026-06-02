/**
 * @java Core/src/game/functions/graph/operators/Add.java
 * Adds vertices, edges and/or faces to a graph.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Coordinate pair. */
type Pt = readonly [number, number];

/**
 * Add operator: append vertices/edges/faces to a graph.
 * @java game/functions/graph/operators/Add.java
 */
export class Add extends BaseGraphFunction {
  private readonly graphFn: GraphFunction | null;
  /** Vertex coordinates to add: [[x,y], ...] */
  private readonly vertices: ReadonlyArray<Pt>;
  /** Edge endpoint coordinate pairs to add: [[[ax,ay],[bx,by]], ...] */
  private readonly edgesByCoord: ReadonlyArray<readonly [Pt, Pt]>;
  /** Edge endpoint vertex indices to add: [[a,b], ...] */
  private readonly edgesByIndex: ReadonlyArray<readonly [number, number]>;
  /** Face vertex coordinate rings: [[[x,y],...], ...] */
  private readonly facesByCoord: ReadonlyArray<ReadonlyArray<Pt>>;
  /** Face vertex index rings: [[i,j,k,...], ...] */
  private readonly facesByIndex: ReadonlyArray<ReadonlyArray<number>>;
  private readonly connect: boolean;

  constructor(args: {
    graph?: GraphFunction | null;
    vertices?: ReadonlyArray<Pt>;
    edgesByCoord?: ReadonlyArray<readonly [Pt, Pt]>;
    edgesByIndex?: ReadonlyArray<readonly [number, number]>;
    facesByCoord?: ReadonlyArray<ReadonlyArray<Pt>>;
    facesByIndex?: ReadonlyArray<ReadonlyArray<number>>;
    connect?: boolean;
  }) {
    super();
    this._dim = [];
    this.graphFn = args.graph ?? null;
    this.vertices = args.vertices ?? [];
    this.edgesByCoord = args.edgesByCoord ?? [];
    this.edgesByIndex = args.edgesByIndex ?? [];
    this.facesByCoord = args.facesByCoord ?? [];
    this.facesByIndex = args.facesByIndex ?? [];
    this.connect = args.connect ?? false;
  }

  /** @java Add.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn != null ? this.graphFn.eval(siteType) : new Graph();

    // Add vertices by coordinate
    const newVerts: number[] = [];
    for (const [x, y] of this.vertices) {
      const existing = graph.findVertex(x, y);
      if (existing < 0) {
        newVerts.push(graph.addVertex(x, y));
      }
    }

    // Add edges by coordinate (find or create endpoint vertices)
    for (const [[ax, ay], [bx, by]] of this.edgesByCoord) {
      let vA = graph.findVertex(ax, ay);
      if (vA < 0) vA = graph.addVertex(ax, ay);
      let vB = graph.findVertex(bx, by);
      if (vB < 0) vB = graph.addVertex(bx, by);
      graph.addEdge(vA, vB);
    }

    // Add edges by vertex index
    for (const [a, b] of this.edgesByIndex) {
      if (a < graph.vertices.length && b < graph.vertices.length)
        graph.addEdge(a, b);
    }

    // Add faces by coordinate (find or create vertices, then edges, then face)
    for (const ring of this.facesByCoord) {
      const vids: number[] = [];
      for (const [x, y] of ring) {
        let vid = graph.findVertex(x, y);
        if (vid < 0) vid = graph.addVertex(x, y);
        vids.push(vid);
      }
      // Create boundary edges
      for (let n = 0; n < vids.length; n += 1)
        graph.addEdge(vids[n] as number, vids[(n + 1) % vids.length] as number);
      graph.findOrAddFace(vids);
    }

    // Add faces by vertex index
    for (const ring of this.facesByIndex) {
      if (ring.length < 3) continue;
      const vids = [...ring];
      // Create boundary edges
      for (let n = 0; n < vids.length; n += 1)
        graph.addEdge(vids[n] as number, vids[(n + 1) % vids.length] as number);
      graph.findOrAddFace(vids);
    }

    // Connect new vertices to nearby neighbours if requested
    if (this.connect && newVerts.length > 0) {
      const threshold = 1.1 * graph.averageEdgeLength();
      const vs = graph.vertices;
      for (const nv of newVerts) {
        const vA = vs[nv];
        if (!vA) continue;
        for (const vB of vs) {
          if (vB.id === nv) continue;
          const dist = Math.sqrt((vA.x - vB.x) ** 2 + (vA.y - vB.y) ** 2);
          if (dist < threshold) graph.addEdge(nv, vB.id);
        }
      }
    }

    return graph;
  }
}
