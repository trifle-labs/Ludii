/**
 * Planar graph board model — Java parity with
 * Core/src/game/util/graph/Graph.java (+ Vertex / Edge / Face).
 *
 * A Ludii board is a planar graph: vertices carry 2-D positions, edges join
 * vertices, and faces are the minimal bounded cycles of the planar embedding.
 * Games play either on the faces (`use:Cell`, the default) or on the vertices
 * (`use:Vertex`, e.g. Go / shibumi-style boards). Direction adjacency is
 * derived geometrically from the embedding (see trajectories.ts), so unlike
 * the legacy lattice model this representation supports arbitrary tilings and
 * the board-algebra operators (merge / add / dual / …).
 *
 * This module is the data layer only: construction, deduplicating
 * vertex/edge insertion, and planar face detection. Generators and operators
 * build on top of it.
 */

/** Coincidence tolerance for treating two vertex positions as the same. */
export const VERTEX_TOL = 0.01;

export interface GVertex {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

export interface GEdge {
  readonly id: number;
  /** Endpoint vertex ids (unordered). */
  readonly a: number;
  readonly b: number;
}

export interface GFace {
  readonly id: number;
  /** Ordered vertex ids around the polygon (CCW). */
  readonly vertices: readonly number[];
  /** Centroid coordinates. */
  readonly cx: number;
  readonly cy: number;
}

const hypot = (dx: number, dy: number): number => Math.sqrt(dx * dx + dy * dy);

/**
 * A mutable planar graph. Build it with `addVertex` / `addEdge`, then call
 * `makeFaces()` to populate the bounded faces. All accessors return frozen
 * snapshots so downstream board code can hold them safely.
 */
export class Graph {
  private vlist: GVertex[] = [];
  private elist: GEdge[] = [];
  private flist: GFace[] = [];
  /** Undirected edge-key → edge id, for dedup. */
  private edgeKey = new Map<string, number>();

  public get vertices(): readonly GVertex[] {
    return this.vlist;
  }
  public get edges(): readonly GEdge[] {
    return this.elist;
  }
  public get faces(): readonly GFace[] {
    return this.flist;
  }

  /** Find an existing vertex within `tol` of (x, y), else add a new one. */
  public addVertex(x: number, y: number, tol = VERTEX_TOL): number {
    for (const v of this.vlist) {
      if (hypot(v.x - x, v.y - y) <= tol) return v.id;
    }
    const id = this.vlist.length;
    this.vlist.push({ id, x, y });
    return id;
  }

  /** Add an undirected edge between two vertex ids (deduplicated). */
  public addEdge(a: number, b: number): number {
    if (a === b) return -1;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    const existing = this.edgeKey.get(key);
    if (existing !== undefined) return existing;
    const id = this.elist.length;
    this.elist.push({ id, a, b });
    this.edgeKey.set(key, id);
    return id;
  }

  public hasEdge(a: number, b: number): boolean {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    return this.edgeKey.has(key);
  }

  /** Mean edge length, used by operators that auto-connect nearby vertices. */
  public averageEdgeLength(): number {
    if (this.elist.length === 0) return 0;
    let total = 0;
    for (const e of this.elist) {
      const va = this.vlist[e.a];
      const vb = this.vlist[e.b];
      if (va && vb) total += hypot(va.x - vb.x, va.y - vb.y);
    }
    return total / this.elist.length;
  }

  /**
   * Detect the bounded faces of the planar embedding and store them. Uses the
   * standard half-edge traversal: at each vertex incident edges are sorted by
   * angle; arriving along (u→v) the next half-edge is the one immediately
   * clockwise from (v→u). Every directed half-edge belongs to exactly one
   * cycle; the single unbounded (outer) cycle — the one whose signed area is
   * the most negative — is discarded.
   */
  public makeFaces(): void {
    this.flist = [];
    if (this.elist.length === 0) return;

    // Sorted adjacency: for each vertex, neighbour ids ordered by edge angle.
    const adj: { to: number; angle: number }[][] = this.vlist.map(() => []);
    for (const e of this.elist) {
      const va = this.vlist[e.a];
      const vb = this.vlist[e.b];
      if (!va || !vb) continue;
      adj[e.a]?.push({ to: e.b, angle: Math.atan2(vb.y - va.y, vb.x - va.x) });
      adj[e.b]?.push({ to: e.a, angle: Math.atan2(va.y - vb.y, va.x - vb.x) });
    }
    for (const list of adj) list.sort((p, q) => p.angle - q.angle);

    // index of neighbour `to` within vertex `v`'s sorted adjacency.
    const indexOf = (v: number, to: number): number => {
      const list = adj[v];
      if (!list) return -1;
      for (let i = 0; i < list.length; i += 1) {
        if (list[i]?.to === to) return i;
      }
      return -1;
    };

    const visited = new Set<string>(); // directed half-edge "u>v"
    const cycles: number[][] = [];

    for (const e of this.elist) {
      for (const [u0, v0] of [
        [e.a, e.b],
        [e.b, e.a],
      ] as const) {
        if (visited.has(`${u0}>${v0}`)) continue;
        const cycle: number[] = [];
        let u = u0;
        let v = v0;
        let guard = 0;
        const limit = this.elist.length * 2 + 4;
        while (guard < limit) {
          guard += 1;
          visited.add(`${u}>${v}`);
          cycle.push(u);
          // Next half-edge: clockwise neighbour of u as seen from v.
          const list = adj[v];
          if (!list || list.length === 0) break;
          const i = indexOf(v, u);
          if (i < 0) break;
          const next = list[(i - 1 + list.length) % list.length];
          if (!next) break;
          u = v;
          v = next.to;
          if (u === u0 && v === v0) break;
        }
        if (cycle.length >= 3) cycles.push(cycle);
      }
    }

    // Signed area (shoelace); the outer face is the most-negative one.
    const signedArea = (cyc: readonly number[]): number => {
      let s = 0;
      for (let i = 0; i < cyc.length; i += 1) {
        const p = this.vlist[cyc[i] as number];
        const q = this.vlist[cyc[(i + 1) % cyc.length] as number];
        if (p && q) s += p.x * q.y - q.x * p.y;
      }
      return s / 2;
    };

    let outerIdx = -1;
    let outerArea = 0;
    const areas = cycles.map((c, i) => {
      const ar = signedArea(c);
      if (ar < outerArea) {
        outerArea = ar;
        outerIdx = i;
      }
      return ar;
    });

    const seen = new Set<string>();
    for (let i = 0; i < cycles.length; i += 1) {
      if (i === outerIdx) continue;
      const cyc = cycles[i] as number[];
      if ((areas[i] as number) <= 0) continue; // keep CCW bounded faces only
      const key = [...cyc].sort((a, b) => a - b).join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      let cx = 0;
      let cy = 0;
      for (const vid of cyc) {
        const vtx = this.vlist[vid];
        if (vtx) {
          cx += vtx.x;
          cy += vtx.y;
        }
      }
      this.flist.push({
        id: this.flist.length,
        vertices: cyc,
        cx: cx / cyc.length,
        cy: cy / cyc.length,
      });
    }
  }

  /**
   * Reorder vertices (and remap edges) bottom-to-top, left-to-right — Java's
   * `Graph.reorder()` sort key `y * K + x`. Faces are re-derived afterwards by
   * the caller if needed; here we only renumber vertices and edges.
   */
  public reorder(): void {
    const order = [...this.vlist].sort((p, q) =>
      p.y !== q.y ? p.y - q.y : p.x - q.x,
    );
    const remap = new Array<number>(this.vlist.length);
    order.forEach((v, i) => {
      remap[v.id] = i;
    });
    this.vlist = order.map((v, i) => ({ id: i, x: v.x, y: v.y }));
    this.elist = this.elist.map((e, i) => ({
      id: i,
      a: remap[e.a] as number,
      b: remap[e.b] as number,
    }));
    this.edgeKey.clear();
    for (const e of this.elist) {
      const key = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
      this.edgeKey.set(key, e.id);
    }
  }
}
