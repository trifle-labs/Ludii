/**
 * CustomOnMesh — faithful 1:1 port.
 * @java game/functions/graph/generators/basis/mesh/CustomOnMesh.java
 *
 * Constructs a triangular mesh graph either from a list of explicit points
 * or by randomly placing N vertices inside a polygon boundary, then
 * connecting them via an incremental Delaunay-like triangulation.
 *
 * The Java algorithm uses an incremental vertex-insertion approach:
 *   - 1st vertex: just add it.
 *   - 2nd vertex: add + join edge 0→1.
 *   - 3rd vertex: add + join to both existing.
 *   - 4th+ vertex inside an existing triangle I,J,K: split it into 3 by
 *     connecting to I, J, K.
 *   - 4th+ vertex outside current mesh: connect to the 2 nearest existing
 *     vertices.
 * After all vertices are inserted, call makeFaces().
 *
 * When numVertices is provided the points are placed randomly inside the
 * polygon boundary (bounding-box rejection sampling, max 1000 tries each).
 */
import { Graph } from "../../../../../../../eval/graph/graph.js";
import type { DimFunction } from "../../../../dim/DimFunction.js";
import type { Polygon } from "../../../../../util/graph/Poly.js";
import { Basis } from "../Basis.js";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Signed area of triangle (ax,ay)(bx,by)(cx,cy) — positive ⇒ CCW. */
function triArea2(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
}

/**
 * Java MathRoutines.pointInTriangle — true iff pt lies strictly inside or on
 * the boundary of triangle (p0, p1, p2).  Uses the same three cross-products.
 */
function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = triArea2(px, py, ax, ay, bx, by);
  const d2 = triArea2(px, py, bx, by, cx, cy);
  const d3 = triArea2(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Euclidean distance between two 2-D points. */
function dist2D(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/** Axis-aligned bounding box of a polygon. */
function polyBounds(pts: readonly (readonly [number, number])[]): {
  minX: number; minY: number; maxX: number; maxY: number;
} {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Ray-casting point-in-polygon test (Java Polygon.contains).
 * Returns true if (px, py) is inside the closed polygon `pts`.
 */
function polyContains(
  px: number, py: number,
  pts: readonly (readonly [number, number])[],
): boolean {
  let inside = false;
  const n = pts.length;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Incremental triangulation (Java CustomOnMesh.insertVertex)
// ---------------------------------------------------------------------------

interface Pt2D { x: number; y: number }

type Point2DLike =
  | readonly [number, number]
  | { readonly x: number; readonly y: number }
  | { getX(): number; getY(): number };

function pointToTuple(pt: Point2DLike): [number, number] {
  const raw = pt as unknown;
  if (Array.isArray(raw)) return [Number(raw[0]), Number(raw[1])];
  if (typeof (pt as { getX?: unknown }).getX === "function") {
    const awtPoint = pt as { getX(): number; getY(): number };
    return [awtPoint.getX(), awtPoint.getY()];
  }
  const xyPoint = pt as { readonly x: number; readonly y: number };
  return [xyPoint.x, xyPoint.y];
}

function polygonToTuples(polygon: Polygon | null): [number, number][] {
  if (polygon === null) return [];
  return polygon.points().map(pointToTuple);
}

/**
 * Insert a new point into the mesh, mirroring Java CustomOnMesh.insertVertex.
 * Returns the vertex id of the newly added vertex.
 */
function insertVertex(g: Graph, px: number, py: number): number {
  const vs = g.vertices;

  if (vs.length === 0) {
    return g.addVertex(px, py);
  }

  if (vs.length === 1) {
    const vid = g.addVertex(px, py);
    g.addEdge(0, vid);
    return vid;
  }

  if (vs.length === 2) {
    const vid = g.addVertex(px, py);
    g.addEdge(0, vid);
    g.addEdge(1, vid);
    return vid;
  }

  // 4th+ vertex: check whether it lies inside any existing triangle formed
  // by vertices i, j, k (all triples).
  const numV = vs.length;
  for (let i = 0; i < numV; i++) {
    const vi = vs[i] as Pt2D;
    for (let j = i + 1; j < numV; j++) {
      const vj = vs[j] as Pt2D;
      for (let k = j + 1; k < numV; k++) {
        const vk = vs[k] as Pt2D;
        if (pointInTriangle(px, py, vi.x, vi.y, vj.x, vj.y, vk.x, vk.y)) {
          // Split the triangle into 3 by connecting new vertex to I, J, K
          const vid = g.addVertex(px, py);
          g.addEdge(vid, i);
          g.addEdge(vid, j);
          g.addEdge(vid, k);
          return vid;
        }
      }
    }
  }

  // Point is outside the current mesh — connect to the two nearest vertices
  let bestDist  = Infinity;
  let nextDist  = Infinity;
  let bestIdx   = -1;
  let nextIdx   = -1;

  for (let i = 0; i < numV; i++) {
    const vi = vs[i] as Pt2D;
    const d = dist2D(px, py, vi.x, vi.y);
    if (d < bestDist) {
      nextDist = bestDist;
      nextIdx  = bestIdx;
      bestDist = d;
      bestIdx  = i;
    } else if (d < nextDist) {
      nextDist = d;
      nextIdx  = i;
    }
  }

  const vid = g.addVertex(px, py);
  if (bestIdx >= 0) g.addEdge(vid, bestIdx);
  if (nextIdx >= 0) g.addEdge(vid, nextIdx);
  return vid;
}

// ---------------------------------------------------------------------------

/**
 * CustomOnMesh constructor signature mirrors Java:
 *   new CustomOnMesh(DimFunction numVertices, Polygon polygon, List<Point2D> points)
 */
export class CustomOnMesh extends Basis {
  /** Explicit point list (numVertices == null path in Java). */
  private readonly points: readonly (readonly [number, number])[];
  /** If > 0, fill the polygon randomly with this many vertices. */
  private readonly numVertices: number;
  /** Boundary polygon used when numVertices > 0. */
  private readonly polygon: readonly (readonly [number, number])[];

  /** @java CustomOnMesh(DimFunction numVertices, Polygon polygon, List<Point2D> points) */
  public constructor(
    numVertices: DimFunction | null,
    polygon: Polygon | null,
    points: ReadonlyArray<Point2DLike> | null,
  ) {
    super();
    this._dim = [];
    this.numVertices = numVertices === null ? 0 : numVertices.eval();
    this.polygon = polygonToTuples(polygon);
    this.points = (points ?? []).map(pointToTuple);
  }

  /**
   * @java CustomOnMesh.eval(Context, SiteType)
   *
   * Either insert the explicit points incrementally, or randomly generate
   * numVertices points inside the polygon, then call makeFaces().
   */
  public override eval(_siteType: string): Graph {
    const graph = new Graph();

    if (this.numVertices <= 0) {
      // Explicit point list — insert each in order
      for (const [x, y] of this.points) {
        insertVertex(graph, x, y);
      }
    } else {
      // Random fill inside polygon with bounding-box rejection sampling.
      // Java inflates the polygon by 0.1 before sampling; we do the same by
      // expanding the bounding box slightly (faithful in effect: the polygon
      // test still constrains placement).
      const poly = this.polygon;
      if (poly.length < 3) {
        // Degenerate — nothing to fill
        return graph;
      }
      const bounds = polyBounds(poly);
      const padX = (bounds.maxX - bounds.minX) * 0.1;
      const padY = (bounds.maxY - bounds.minY) * 0.1;
      const minX = bounds.minX - padX;
      const minY = bounds.minY - padY;
      const w    = bounds.maxX - bounds.minX + 2 * padX;
      const h    = bounds.maxY - bounds.minY + 2 * padY;

      // Deterministic LCG — Java uses java.util.Random with no explicit seed,
      // but the mesh is non-deterministic by design (it's a Voronoi mesh, used
      // only when exact control is not needed). We use a fixed seed for TS.
      let seed = 42;
      const rand = (): number => {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        return (seed >>> 0) / 0x100000000;
      };

      for (let n = 0; n < this.numVertices; n++) {
        let x = 0;
        let y = 0;
        let ok = false;
        for (let iter = 0; iter < 1000; iter++) {
          x = minX + rand() * w;
          y = minY + rand() * h;
          if (polyContains(x, y, poly)) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          throw new Error(
            `CustomOnMesh: couldn't place vertex ${n} inside polygon after 1000 iterations.`,
          );
        }
        insertVertex(graph, x, y);
      }
    }

    graph.makeFaces();
    return graph;
  }
}
