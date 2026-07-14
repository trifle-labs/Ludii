/**
 * @java Core/src/game/functions/graph/operators/Remove.java
 * Removes vertices, edges and/or faces from a graph.
 *
 * Vertex/edge removal is implemented by rebuilding the graph without the
 * dropped elements, since the TS Graph class has no in-place removeVertex /
 * removeEdge methods.
 */

import { Graph } from "../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../dim/DimFunction.js";
import { BaseGraphFunction } from "../BaseGraphFunction.js";
import type { GraphFunction } from "../GraphFunction.js";
import { Poly } from "../../../util/graph/Poly.js";

/** Ray-cast point-in-polygon — @java Polygon.contains. */
function polyContains(
  poly: ReadonlyArray<readonly [number, number]>,
  px: number,
  py: number,
): boolean {
  const n = poly.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const pi = poly[i]!;
    const pj = poly[j]!;
    const intersect =
      (pi[1] > py) !== (pj[1] > py) &&
      px < ((pj[0] - pi[0]) * (py - pi[1])) / (pj[1] - pi[1]) + pi[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Inflate a polygon slightly outward from its centroid. @java Polygon.inflate */
function inflate(
  poly: ReadonlyArray<readonly [number, number]>,
  amount: number,
): ReadonlyArray<readonly [number, number]> {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of poly) { cx += x; cy += y; }
  cx /= poly.length;
  cy /= poly.length;
  return poly.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return [x + (dx / len) * amount, y + (dy / len) * amount] as const;
  });
}

/** Rebuild a graph without the specified vertex ids. */
function graphWithoutVertices(source: Graph, dropVids: ReadonlySet<number>): Graph {
  const out = new Graph();
  const remap = new Map<number, number>();
  for (const v of source.vertices) {
    if (dropVids.has(v.id)) continue;
    remap.set(v.id, out.addVertex(v.x, v.y));
  }
  for (const e of source.edges) {
    const a = remap.get(e.a);
    const b = remap.get(e.b);
    if (a !== undefined && b !== undefined) out.addEdge(a, b);
  }
  // Re-add surviving faces
  for (const f of source.faces) {
    if (f.vertices.some((v) => dropVids.has(v))) continue;
    const vids = f.vertices.map((v) => remap.get(v) as number);
    if (vids.every((v) => v >= 0)) out.findOrAddFace(vids);
  }
  // @java Board.init → graph.measure → MeasureGraph.measurePerimeter
  // (MeasureGraph.java:81): Java measures the FINAL graph after the operator
  // chain. The rebuilt graph here has an empty perimeter (Game of Dwarfs'
  // (sites Outer) returned [] and a start Gnome was never placed); retrace
  // from edges — makeFaces would resurrect the deleted faces
  // (Remove.java:318 "Do not create faces!").
  out.measurePerimeter();
  return out;
}

/** Rebuild a graph without the specified edge (a,b). */
function graphWithoutEdges(
  source: Graph,
  dropEdges: ReadonlySet<string>,
): Graph {
  const out = new Graph();
  for (const v of source.vertices) out.addVertex(v.x, v.y);
  for (const e of source.edges) {
    const k = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
    if (!dropEdges.has(k)) out.addEdge(e.a, e.b);
  }
  for (const f of source.faces) out.findOrAddFace([...f.vertices]);
  // @java MeasureGraph.measurePerimeter (MeasureGraph.java:81) — same as
  // graphWithoutVertices above: the rebuilt graph must retrace its boundary.
  out.measurePerimeter();
  return out;
}

type Pt = readonly [number, number];
type DimArg = DimFunction | number;
type FacePositions = ReadonlyArray<ReadonlyArray<Pt>>;
type EdgePositions = ReadonlyArray<readonly [Pt, Pt]>;
type VertexPositions = ReadonlyArray<Pt>;
type EdgeIndicesInput = ReadonlyArray<ReadonlyArray<DimArg>>;

type RemoveArgs = {
  polygon?: ReadonlyArray<Pt> | null;
  facePositions?: FacePositions;
  faceIndices?: ReadonlyArray<DimArg>;
  edgePositions?: EdgePositions;
  edgeIndices?: EdgeIndicesInput;
  vertexPositions?: VertexPositions;
  vertexIndices?: ReadonlyArray<DimArg>;
  trimEdges?: boolean | null;
};

function isPoly(value: unknown): value is Poly {
  return value instanceof Poly;
}

function isRemoveArgs(value: unknown): value is RemoveArgs {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !isPoly(value);
}

function polygonPoints(poly: Poly): Pt[] {
  return poly.polygon().points().map((p) => [p.x, p.y] as const);
}

function dimValue(value: DimArg): number {
  return typeof value === "number" ? value : value.eval();
}

function dimArray(values: ReadonlyArray<DimArg> | null | undefined): number[] {
  return values?.map(dimValue) ?? [];
}

function edgeIndexArray(values: EdgeIndicesInput | null | undefined): Array<readonly [number, number]> {
  if (values == null) return [];
  const out: Array<readonly [number, number]> = [];
  for (const pair of values) {
    if (pair.length < 2) continue;
    out.push([dimValue(pair[0]!), dimValue(pair[1]!)] as const);
  }
  return out;
}

/**
 * Remove operator: delete vertices, edges and/or faces.
 * @java game/functions/graph/operators/Remove.java
 */
export class Remove extends BaseGraphFunction {
  private readonly graphFn: GraphFunction;
  private readonly polygon: ReadonlyArray<Pt> | null;
  private readonly facePositions: ReadonlyArray<ReadonlyArray<Pt>>;
  private readonly faceIndices: ReadonlyArray<number>;
  private readonly edgePositions: ReadonlyArray<readonly [Pt, Pt]>;
  private readonly edgeIndices: ReadonlyArray<readonly [number, number]>;
  private readonly vertexPositions: ReadonlyArray<Pt>;
  private readonly vertexIndices: ReadonlyArray<number>;
  private readonly trimEdges: boolean;

  /** @java Remove(GraphFunction, Float[][][], DimFunction[], Float[][][], DimFunction[][], Float[][], DimFunction[], Boolean) */
  public constructor(
    graphFn: GraphFunction,
    cells?: FacePositions | null,
    Cells?: ReadonlyArray<DimArg> | null,
    edges?: EdgePositions | null,
    Edges?: EdgeIndicesInput | null,
    vertices?: VertexPositions | null,
    Vertices?: ReadonlyArray<DimArg> | null,
    trimEdges?: boolean | null,
  );
  /** @java Remove(GraphFunction, Poly, Boolean) */
  public constructor(graphFn: GraphFunction, poly: Poly, trimEdges?: boolean | null);
  /** Compatibility with the previous TS options-object constructor. */
  public constructor(graphFn: GraphFunction, args?: RemoveArgs);
  constructor(
    graphFn: GraphFunction,
    cellsOrPolyOrArgs: FacePositions | Poly | RemoveArgs | null = null,
    CellsOrTrimEdges: ReadonlyArray<DimArg> | boolean | null = null,
    edges: EdgePositions | null = null,
    Edges: EdgeIndicesInput | null = null,
    vertices: VertexPositions | null = null,
    Vertices: ReadonlyArray<DimArg> | null = null,
    trimEdges: boolean | null = null,
  ) {
    super();
    this._dim = [];
    this.graphFn = graphFn;

    if (isPoly(cellsOrPolyOrArgs)) {
      this.polygon = polygonPoints(cellsOrPolyOrArgs);
      this.facePositions = [];
      this.faceIndices = [];
      this.edgePositions = [];
      this.edgeIndices = [];
      this.vertexPositions = [];
      this.vertexIndices = [];
      this.trimEdges = typeof CellsOrTrimEdges === "boolean" ? CellsOrTrimEdges : true;
      return;
    }

    if (isRemoveArgs(cellsOrPolyOrArgs)) {
      const args = cellsOrPolyOrArgs;
      this.polygon = args.polygon ?? null;
      this.facePositions = args.facePositions ?? [];
      this.faceIndices = dimArray(args.faceIndices);
      this.edgePositions = args.edgePositions ?? [];
      this.edgeIndices = edgeIndexArray(args.edgeIndices);
      this.vertexPositions = args.vertexPositions ?? [];
      this.vertexIndices = dimArray(args.vertexIndices);
      this.trimEdges = args.trimEdges ?? true;
      return;
    }

    this.polygon = null;
    this.facePositions = cellsOrPolyOrArgs ?? [];
    this.faceIndices = Array.isArray(CellsOrTrimEdges) ? dimArray(CellsOrTrimEdges) : [];
    this.edgePositions = edges ?? [];
    this.edgeIndices = edgeIndexArray(Edges);
    this.vertexPositions = vertices ?? [];
    this.vertexIndices = dimArray(Vertices);
    this.trimEdges = trimEdges ?? true;
  }

  /** @java Remove.eval(Context, SiteType) */
  public override eval(siteType: string): Graph {
    let graph = this.graphFn.eval(siteType);

    // Polygon-based removal: remove vertices inside the polygon
    if (this.polygon != null && this.polygon.length >= 3) {
      const poly = inflate(this.polygon, 0.1);
      const drop = new Set<number>();
      for (const v of graph.vertices)
        if (polyContains(poly, v.x, v.y)) drop.add(v.id);
      if (drop.size > 0) graph = graphWithoutVertices(graph, drop);
    }

    // Remove faces by position (vertex ring coordinates)
    for (const ring of this.facePositions) {
      const vids = ring.map(([x, y]) => graph.findVertex(x, y));
      if (vids.some((v) => v < 0)) continue;
      const fid = findFaceByVerts(graph, vids);
      if (fid >= 0) graph.removeFacesByIndex([fid]);
    }

    // Remove faces by index (descending to preserve indices)
    if (this.faceIndices.length > 0) {
      const sorted = [...this.faceIndices].sort((a, b) => b - a);
      graph.removeFacesByIndex(sorted);
    }

    // Remove edges by coordinate
    if (this.edgePositions.length > 0) {
      const dropEdges = new Set<string>();
      for (const [[ax, ay], [bx, by]] of this.edgePositions) {
        const vA = graph.findVertex(ax, ay);
        const vB = graph.findVertex(bx, by);
        if (vA >= 0 && vB >= 0) {
          const k = vA < vB ? `${vA}:${vB}` : `${vB}:${vA}`;
          dropEdges.add(k);
        }
      }
      if (dropEdges.size > 0) graph = graphWithoutEdges(graph, dropEdges);
    }

    // Remove edges by vertex index pairs
    if (this.edgeIndices.length > 0) {
      const dropEdges = new Set<string>();
      for (const [a, b] of this.edgeIndices) {
        const k = a < b ? `${a}:${b}` : `${b}:${a}`;
        dropEdges.add(k);
      }
      graph = graphWithoutEdges(graph, dropEdges);
    }

    // Remove vertices by position
    if (this.vertexPositions.length > 0) {
      const drop = new Set<number>();
      for (const [x, y] of this.vertexPositions) {
        const vid = graph.findVertex(x, y);
        if (vid >= 0) drop.add(vid);
      }
      if (drop.size > 0) graph = graphWithoutVertices(graph, drop);
    }

    // Remove vertices by index (descending)
    if (this.vertexIndices.length > 0) {
      const drop = new Set<number>(this.vertexIndices);
      graph = graphWithoutVertices(graph, drop);
    }

    return graph;
  }
}

function findFaceByVerts(graph: Graph, vids: number[]): number {
  const want = new Set(vids);
  for (const f of graph.faces) {
    if (
      f.vertices.length === vids.length &&
      f.vertices.every((v) => want.has(v))
    )
      return f.id;
  }
  return -1;
}
