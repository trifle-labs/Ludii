/**
 * Board-algebra operators — Java parity with
 * Core/src/game/functions/graph/operators/**. Each takes one or more planar
 * {@link Graph}s and returns a new one. Vertex coincidence is handled by
 * `Graph.addVertex`'s tolerance dedup, so `merge`/`union` reduce to re-adding
 * every vertex and edge into a fresh graph.
 */

import { Graph, VERTEX_TOL } from "./graph.js";

/** Re-add a graph's vertices and edges into `out`, returning the id remap. */
function absorb(out: Graph, g: Graph, tol = VERTEX_TOL): number[] {
  const map = g.vertices.map((v) => out.addVertex(v.x, v.y, tol));
  for (const e of g.edges) out.addEdge(map[e.a] as number, map[e.b] as number);
  return map;
}

/** `(merge g1 g2 …)` / `(union …)` — overlay graphs, fusing coincident vertices. */
export function merge(graphs: readonly Graph[], tol = VERTEX_TOL): Graph {
  const out = new Graph();
  for (const g of graphs) absorb(out, g, tol);
  out.makeFaces();
  return out;
}

export const union = merge;

/**
 * Java `Graph.reorder(SiteType.Vertex)` — renumber vertices ascending by the
 * score `y·100 + x` (lower-then-lefter first). Every base graph generator
 * (RectangleOnSquare, Repeat, Regular, …) calls this on its output, so the
 * final play-site indices follow this order; `merge`/`shift` do NOT reorder,
 * they preserve their operands' order. Returns a fresh graph with remapped
 * edges and rebuilt faces.
 */
export function reorderByPosition(g: Graph): Graph {
  const order = g.vertices
    .map((v) => v.id)
    .sort((a, b) => {
      const va = g.vertices[a] as { x: number; y: number };
      const vb = g.vertices[b] as { x: number; y: number };
      return va.y * 100 + va.x - (vb.y * 100 + vb.x);
    });
  const out = new Graph();
  const remap = new Array<number>(g.vertices.length);
  for (const oldId of order) {
    const v = g.vertices[oldId] as { x: number; y: number };
    remap[oldId] = out.addVertex(v.x, v.y);
  }
  for (const e of g.edges) {
    out.addEdge(remap[e.a] as number, remap[e.b] as number);
  }
  out.makeFaces();
  return out;
}

/**
 * Apply a per-vertex coordinate transform. When the operand already has faces
 * (the normal case for a fully-built board), preserve them 1:1 via
 * {@link Graph.withTransformedCoordinates} — faithful to Java's in-place
 * `Graph.rotate/shift/scale/skew`, which never rebuild faces. This keeps a
 * prior `(remove … cells:{…})` / `(hole …)` instead of resurrecting the deleted
 * faces (the cause of `(rotate 90 (remove (hex …) cells:{…}))` boards — e.g.
 * Hexshogi, Xiang Hex — coming back at full size). A faceless operand (not yet
 * triangulated) falls back to the rebuild path so its faces still get made.
 */
function transform(g: Graph, fn: (x: number, y: number) => [number, number]): Graph {
  if (g.faces.length > 0) return g.withTransformedCoordinates(fn);
  const out = new Graph();
  const map = g.vertices.map((v) => {
    const [x, y] = fn(v.x, v.y);
    return out.addVertex(x, y);
  });
  for (const e of g.edges) out.addEdge(map[e.a] as number, map[e.b] as number);
  out.makeFaces();
  return out;
}

/** `(shift dx dy g)` — translate. */
export function shift(dx: number, dy: number, g: Graph): Graph {
  return transform(g, (x, y) => [x + dx, y + dy]);
}

/** `(scale s g)` or `(scale sx sy g)` — scale about the origin. */
export function scale(sx: number, sy: number, g: Graph): Graph {
  return transform(g, (x, y) => [x * sx, y * sy]);
}

/**
 * `(rotate degrees g)` — rotate anticlockwise about the graph's midpoint (the
 * bounding-box centre), matching Java `Graph.rotate` (NOT about the origin).
 */
export function rotate(degrees: number, g: Graph): Graph {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const b = bounds(g);
  const px = b.minX + (b.maxX - b.minX) / 2;
  const py = b.minY + (b.maxY - b.minY) / 2;
  return transform(g, (x, y) => {
    const dx = x - px;
    const dy = y - py;
    return [px + dx * c - dy * s, py + dy * c + dx * s];
  });
}

/**
 * `(skew amount g)` — horizontal shear, with the offset measured from the
 * graph's lowest vertex (Java `Graph.skew`: `x += (y − minY)·amount`).
 */
export function skew(amount: number, g: Graph): Graph {
  const minY = bounds(g).minY;
  return transform(g, (x, y) => [x + (y - minY) * amount, y]);
}

/** Axis-aligned bounding box of a graph's vertices. */
function bounds(g: Graph): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of g.vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/**
 * `(add g vertices:{…} edges:{…})` — append vertices (by coordinate) and edges
 * (by vertex index into the *resulting* vertex list). Faces are recomputed.
 */
export function add(
  base: Graph,
  spec: {
    vertices?: readonly [number, number][];
    edgesByIndex?: readonly [number, number][];
    edgesByCoord?: readonly [[number, number], [number, number]][];
    verticesByIndex?: readonly [number, number][];
  },
): Graph {
  const out = new Graph();
  absorb(out, base);
  if (spec.vertices) for (const [x, y] of spec.vertices) out.addVertex(x, y);
  // `vertices:{ {i j} }` adds an edge between two existing vertex indices.
  if (spec.verticesByIndex)
    for (const [i, j] of spec.verticesByIndex) out.addEdge(i, j);
  if (spec.edgesByIndex)
    for (const [i, j] of spec.edgesByIndex) out.addEdge(i, j);
  // `edges:{ {{ax ay}{bx by}} }` — endpoints given by coordinate; resolve each
  // to its vertex id (matching Java `Add` with `Float[][][] edges`).
  if (spec.edgesByCoord)
    for (const [[ax, ay], [bx, by]] of spec.edgesByCoord) {
      const a = out.findVertex(ax, ay);
      const b = out.findVertex(bx, by);
      if (a >= 0 && b >= 0) out.addEdge(a, b);
    }
  out.makeFaces();
  return out;
}

/**
 * `(remove g vertices:{…} edges:{…})` — drop the listed vertices (and their
 * incident edges) and edges, renumbering survivors.
 */
export function remove(
  base: Graph,
  spec: {
    vertices?: readonly number[];
    edgesByIndex?: readonly [number, number][];
    edgesByCoord?: readonly [[number, number], [number, number]][];
  },
): Graph {
  const drop = new Set(spec.vertices ?? []);
  const edgeKey = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  const dropEdge = new Set(
    (spec.edgesByIndex ?? []).map(([a, b]) => edgeKey(a, b)),
  );
  // `edges:{ {{ax ay}{bx by}} }` — endpoints given by coordinate. Resolve each
  // against the *source* graph (Java `Remove` with `Float[][][] edges` uses
  // `graph.findVertex` then `removeEdge`).
  for (const [[ax, ay], [bx, by]] of spec.edgesByCoord ?? []) {
    const a = base.findVertex(ax, ay);
    const b = base.findVertex(bx, by);
    if (a >= 0 && b >= 0) dropEdge.add(edgeKey(a, b));
  }
  const out = new Graph();
  const map = new Map<number, number>();
  for (const v of base.vertices) {
    if (drop.has(v.id)) continue;
    map.set(v.id, out.addVertex(v.x, v.y));
  }
  for (const e of base.edges) {
    if (drop.has(e.a) || drop.has(e.b)) continue;
    const key = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
    if (dropEdge.has(key)) continue;
    const a = map.get(e.a);
    const b = map.get(e.b);
    if (a !== undefined && b !== undefined) out.addEdge(a, b);
  }
  out.makeFaces();
  return out;
}

/**
 * `(dual g)` — the weak planar dual: one vertex at each face centroid, joined
 * where the source faces share an edge.
 */
export function dual(base: Graph): Graph {
  const out = new Graph();
  const faceVert = base.faces.map((f) => out.addVertex(f.cx, f.cy));
  // Map each undirected edge to the faces touching it.
  const edgeFaces = new Map<string, number[]>();
  const key = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  base.faces.forEach((f, fi) => {
    const vs = f.vertices;
    for (let i = 0; i < vs.length; i += 1) {
      const k = key(vs[i] as number, vs[(i + 1) % vs.length] as number);
      (edgeFaces.get(k) ?? edgeFaces.set(k, []).get(k)!).push(fi);
    }
  });
  for (const fs of edgeFaces.values()) {
    for (let i = 0; i < fs.length; i += 1)
      for (let j = i + 1; j < fs.length; j += 1)
        out.addEdge(faceVert[fs[i] as number] as number, faceVert[fs[j] as number] as number);
  }
  out.makeFaces();
  return out;
}

/**
 * `(intersect g1 g2 …)` — keep vertices present (coincident) in every graph,
 * and edges present in every graph. Approximate but non-throwing.
 */
export function intersect(graphs: readonly Graph[], tol = VERTEX_TOL): Graph {
  if (graphs.length === 0) return new Graph();
  const [first, ...rest] = graphs;
  const out = new Graph();
  const has = (g: Graph, x: number, y: number): boolean =>
    g.vertices.some((v) => Math.hypot(v.x - x, v.y - y) <= tol);
  const keep = (first as Graph).vertices.filter((v) =>
    rest.every((g) => has(g, v.x, v.y)),
  );
  const map = new Map<number, number>();
  for (const v of keep) map.set(v.id, out.addVertex(v.x, v.y));
  for (const e of (first as Graph).edges) {
    const a = map.get(e.a);
    const b = map.get(e.b);
    if (a !== undefined && b !== undefined) out.addEdge(a, b);
  }
  out.makeFaces();
  return out;
}

/** `(clip …)` / `(trim …)` / `(keep …)` — fallback pass-through. */
export function passthrough(g: Graph): Graph {
  return g;
}

// -- splitCrossings ----------------------------------------------------------

const EPSILON = 0.0000001;

interface Pt {
  x: number;
  y: number;
}

/**
 * @java main.math.MathRoutines.crossingPoint — the interior intersection of
 * segments a0→a1 and b0→b1, or null. Both parameters s,t must lie strictly
 * inside (MARGIN..1-MARGIN) so shared endpoints don't count as crossings.
 */
function crossingPoint(a0: Pt, a1: Pt, b0: Pt, b1: Pt): Pt | null {
  const MARGIN = 0.01;
  const xlk = a1.x - a0.x;
  const ylk = a1.y - a0.y;
  const xnm = b1.x - b0.x;
  const ynm = b1.y - b0.y;
  const xmk = b0.x - a0.x;
  const ymk = b0.y - a0.y;
  const det = xnm * ylk - ynm * xlk;
  if (Math.abs(det) < EPSILON) return null; // parallel
  const detinv = 1 / det;
  const s = (xnm * ymk - ynm * xmk) * detinv;
  const t = (xlk * ymk - ylk * xmk) * detinv;
  if (s > MARGIN && s < 1 - MARGIN && t > MARGIN && t < 1 - MARGIN) {
    return { x: a0.x + s * (a1.x - a0.x), y: a0.y + s * (a1.y - a0.y) };
  }
  return null;
}

/** Distance from point p to the segment a→b (clamped to the segment). */
function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < EPSILON) return Math.hypot(p.x - a.x, p.y - a.y);
  let u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  u = Math.max(0, Math.min(1, u));
  return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
}

/**
 * @java main.math.MathRoutines.touchingPoint — true when point p lies on the
 * interior of segment a→b (not at either endpoint).
 */
function touches(p: Pt, a: Pt, b: Pt): boolean {
  const MARGIN = 0.001;
  const distToA = Math.hypot(p.x - a.x, p.y - a.y);
  const distToB = Math.hypot(p.x - b.x, p.y - b.y);
  const distToAB = distanceToSegment(p, a, b);
  return !(distToA < MARGIN || distToB < MARGIN || distToAB > MARGIN);
}

/**
 * `(splitCrossings g)` — add a vertex at every edge crossing and split the two
 * crossing edges through it, then split any edge an existing vertex lies on.
 * @java Core/src/game/functions/graph/operators/SplitCrossings.java —
 * splitAtCrossingPoints + splitAtTouchingPoints, then rebuild faces. Used by
 * star boards (`(splitCrossings (regular Star n))`) to materialise the inner
 * intersection vertices of the pentagram.
 */
export function splitCrossings(g: Graph): Graph {
  const verts: Pt[] = g.vertices.map((v) => ({ x: v.x, y: v.y }));
  const edges: [number, number][] = g.edges.map((e) => [e.a, e.b]);

  const addVertex = (x: number, y: number): number => {
    for (let i = 0; i < verts.length; i += 1) {
      const v = verts[i] as Pt;
      if (Math.hypot(v.x - x, v.y - y) < 1e-6) return i;
    }
    verts.push({ x, y });
    return verts.length - 1;
  };
  const hasEdge = (a: number, b: number): boolean =>
    edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
  const addEdge = (a: number, b: number): void => {
    if (a !== b && !hasEdge(a, b)) edges.push([a, b]);
  };

  // splitAtCrossingPoints
  let didSplit = true;
  while (didSplit) {
    didSplit = false;
    for (let ea = 0; ea < edges.length && !didSplit; ea += 1) {
      const [aa, ab] = edges[ea] as [number, number];
      for (let eb = ea + 1; eb < edges.length && !didSplit; eb += 1) {
        const [ba, bb] = edges[eb] as [number, number];
        const x = crossingPoint(
          verts[aa] as Pt, verts[ab] as Pt, verts[ba] as Pt, verts[bb] as Pt,
        );
        if (!x) continue;
        const vid = addVertex(x.x, x.y);
        edges.splice(eb, 1); // remove higher index first
        edges.splice(ea, 1);
        addEdge(aa, vid);
        addEdge(vid, ab);
        addEdge(ba, vid);
        addEdge(vid, bb);
        didSplit = true;
      }
    }
  }

  // splitAtTouchingPoints
  didSplit = true;
  while (didSplit) {
    didSplit = false;
    for (let ea = 0; ea < edges.length && !didSplit; ea += 1) {
      const [aa, ab] = edges[ea] as [number, number];
      for (let v = 0; v < verts.length && !didSplit; v += 1) {
        if (v === aa || v === ab) continue;
        if (touches(verts[v] as Pt, verts[aa] as Pt, verts[ab] as Pt)) {
          edges.splice(ea, 1);
          addEdge(aa, v);
          addEdge(v, ab);
          didSplit = true;
        }
      }
    }
  }

  const out = new Graph();
  for (const v of verts) out.addVertex(v.x, v.y, 1e-9);
  for (const [a, b] of edges) out.addEdge(a, b);
  out.makeFaces();
  return out;
}
