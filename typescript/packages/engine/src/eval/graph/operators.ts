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

/** Apply a per-vertex coordinate transform, preserving edges. */
function transform(g: Graph, fn: (x: number, y: number) => [number, number]): Graph {
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

/** `(rotate degrees g)` — rotate about the origin. */
export function rotate(degrees: number, g: Graph): Graph {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return transform(g, (x, y) => [x * c - y * s, x * s + y * c]);
}

/** `(skew amount g)` — horizontal shear (x += amount·y). */
export function skew(amount: number, g: Graph): Graph {
  return transform(g, (x, y) => [x + amount * y, y]);
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
  },
): Graph {
  const drop = new Set(spec.vertices ?? []);
  const dropEdge = new Set(
    (spec.edgesByIndex ?? []).map(([a, b]) => (a < b ? `${a}:${b}` : `${b}:${a}`)),
  );
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
