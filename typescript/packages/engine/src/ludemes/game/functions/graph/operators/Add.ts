/**
 * @java Core/src/game/functions/graph/operators/Add.java
 * Adds vertices, edges and/or faces to a graph.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { FloatFunction } from "../../../../base.js";
import type { DimFunction } from "../../dim/DimFunction.js";
import type { GraphFunction } from "../GraphFunction.js";

/** Coordinate pair. */
type Pt = readonly [number, number];
type FloatPointFns = ReadonlyArray<FloatFunction>;
type FloatPointListFns = ReadonlyArray<FloatPointFns>;
type FloatShapeFns = ReadonlyArray<FloatPointListFns>;
type DimPointFns = ReadonlyArray<DimFunction>;
type DimShapeFns = ReadonlyArray<DimPointFns>;

/**
 * Add operator: append vertices/edges/faces to a graph.
 * @java game/functions/graph/operators/Add.java
 */
export class Add extends BaseGraphFunction {
  private readonly graphFn: GraphFunction | null;
  /** Vertex coordinates to add: [[x,y], ...] */
  private readonly vertices: FloatPointListFns;
  /** Edge endpoint coordinate pairs to add: [[[ax,ay],[bx,by]], ...] */
  private readonly edgesByCoord: FloatShapeFns;
  /** Edge endpoint vertex indices to add: [[a,b], ...] */
  private readonly edgesByIndex: DimShapeFns;
  /** Curved edge endpoint/tangent functions; accepted for constructor parity. */
  private readonly edgeCurvedFns: FloatShapeFns;
  /** Face vertex coordinate rings: [[[x,y],...], ...] */
  private readonly facesByCoord: FloatShapeFns;
  /** Face vertex index rings: [[i,j,k,...], ...] */
  private readonly facesByIndex: DimShapeFns;
  private readonly connect: boolean;

  /**
   * @java Add(GraphFunction graph, FloatFunction[][] vertices,
   *           FloatFunction[][][] edges, DimFunction[][] Edges,
   *           FloatFunction[][][] edgesCurved, FloatFunction[][][] cells,
   *           DimFunction[][] Cells, Boolean connect)
   */
  constructor(
    graph?: GraphFunction | null,
    vertices?: FloatFunction[][] | null,
    edges?: FloatFunction[][][] | null,
    Edges?: DimFunction[][] | null,
    edgesCurved?: FloatFunction[][][] | null,
    cells?: FloatFunction[][][] | null,
    Cells?: DimFunction[][] | null,
    connect?: boolean | null,
  ) {
    super();
    this._dim = [];
    if (edges != null && Edges != null)
      throw new Error("Only one 'edge' parameter can be non-null.");
    if (cells != null && Cells != null)
      throw new Error("Only one 'face' parameter can be non-null.");

    this.graphFn = graph ?? null;
    this.vertices = vertices ?? [];
    this.edgesByCoord = edges ?? [];
    this.edgesByIndex = Edges ?? [];
    this.edgeCurvedFns = edgesCurved ?? [];
    this.facesByCoord = cells ?? [];
    this.facesByIndex = Cells ?? [];
    this.connect = connect ?? false;
  }

  /** @java Add.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    const graph = this.graphFn != null ? this.graphFn.eval(siteType) : new Graph();
    if (process.env.TRACE_GRAPHADD) console.error("[graphadd] base", graph.vertices.length, "verts; vertices:", this.vertices.length, "edgesByCoord:", this.edgesByCoord?.length ?? "?", "edgesByIndex:", this.edgesByIndex?.length ?? "?");

    // Add vertices by coordinate
    const newVerts: number[] = [];
    for (const pointFns of this.vertices) {
      const x = evalFloatFn(pointFns[0]);
      const y = evalFloatFn(pointFns[1]);
      const existing = graph.findVertex(x, y);
      if (existing < 0) {
        newVerts.push(graph.addVertex(x, y));
      }
    }

    // Add edges by coordinate (find or create endpoint vertices)
    for (const edgeFns of this.edgesByCoord) {
      const aFns = edgeFns[0];
      const bFns = edgeFns[1];
      if (aFns == null || bFns == null) continue;
      const ax = evalFloatFn(aFns[0]);
      const ay = evalFloatFn(aFns[1]);
      const bx = evalFloatFn(bFns[0]);
      const by = evalFloatFn(bFns[1]);
      let vA = graph.findVertex(ax, ay);
      if (vA < 0) vA = graph.addVertex(ax, ay);
      let vB = graph.findVertex(bx, by);
      if (vB < 0) vB = graph.addVertex(bx, by);
      graph.addEdge(vA, vB);
    }

    // Add edges by vertex index
    for (const edgeFns of this.edgesByIndex) {
      const a = evalDimFn(edgeFns[0]);
      const b = evalDimFn(edgeFns[1]);
      if (a < graph.vertices.length && b < graph.vertices.length)
        graph.addEdge(a, b);
    }

    void this.edgeCurvedFns;

    // Add faces by coordinate (find or create vertices, then edges, then face)
    for (const ringFns of this.facesByCoord) {
      const vids: number[] = [];
      for (const pointFns of ringFns) {
        const x = evalFloatFn(pointFns[0]);
        const y = evalFloatFn(pointFns[1]);
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
    for (const ringFns of this.facesByIndex) {
      if (ringFns.length < 3) continue;
      const vids = ringFns.map(evalDimFn);
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

    // @java Board.init → graph.measure → MeasureGraph.measurePerimeter
    // (MeasureGraph.java:81): Java measures the FINAL graph after the whole
    // operator chain. Add mutates the inner graph in place (new vertices /
    // edges above), so a perimeter traced earlier in the chain — e.g. by the
    // inner generator's makeFaces, or Remove's retrace — is stale here.
    // Retrace on the finished graph (Game of Dwarfs: (add (remove …) …)).
    graph.measurePerimeter();
    return graph;
  }
}

function evalFloatFn(fn: FloatFunction | undefined): number {
  if (fn == null) return 0;
  // Raw-literal rule: lud numeric literals arrive as raw numbers.
  if (typeof (fn as unknown) === "number") return fn as unknown as number;
  return fn.eval({} as Parameters<FloatFunction["eval"]>[0]);
}

function evalDimFn(fn: DimFunction | undefined): number {
  if (fn == null) return 0;
  // Raw-literal rule: edges:{{0 5} ...} pairs arrive as raw numbers — .eval
  // threw, the throw was swallowed upstream, and the whole board came up
  // EMPTY (Game of Solomon / Crand / Pasang add-edges pipelines).
  if (typeof (fn as unknown) === "number") return fn as unknown as number;
  return fn.eval();
}
