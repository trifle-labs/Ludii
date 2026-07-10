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

/**
 * Two vertices coincide iff their *Manhattan* distance is below `tol` — Java
 * parity with `game.util.graph.Vertex.coincident`: `|dx| + |dy| + |dz| < tol`
 * (strict). Using L1 (not Euclidean L2) matters at merge junctions of rotated/
 * scaled sub-boards: a diagonal pair offset by ~(0.006, 0.006) is Euclidean-
 * coincident (hypot ≈ 0.0085 ≤ 0.01) yet Manhattan-separate (0.012 ≥ 0.01).
 * Euclidean dedup wrongly fuses such pairs, removing a vertex and (via Euler
 * V−E+F) leaving one EXTRA cell — shifting every hand/off-board site by one and
 * breaking track entry for custom-board race games (Kawade Kelia, Panchi, …).
 * z is treated as 0 here; the 3-D stacking path uses {@link pushVertex3D}.
 */
function coincident(dx: number, dy: number, tol: number): boolean {
  return Math.abs(dx) + Math.abs(dy) < tol;
}

export interface GVertex {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /**
   * Elevation (Java `Vertex.pt().z()`). Planar boards leave this 0; the
   * pyramidal (Shibumi) square stacks vertices in `n` layers at `z = layer/√2`.
   * Carried through to the topology so `(is Flat)` can read a site's layer.
   */
  readonly z?: number;
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
 * Compass sides of a graph board, keyed by direction name (Java
 * `Topology.sides(SiteType)` for Cell and Vertex). Each entry lists the element
 * ids (face ids for `cell`, vertex ids for `vertex`) lying on that board side.
 * Only the eight compass names that actually occur are present.
 */
export interface GraphSides {
  readonly cell: ReadonlyMap<string, number[]>;
  readonly vertex: ReadonlyMap<string, number[]>;
}

/** Java `MathRoutines.EPSILON`. */
const SIDE_EPS = 1e-7;

/**
 * Java `MathRoutines.clockwise(a, pt, b)` — sign of the turn a→pt→b, used to
 * give the unsigned line distance a convex/concave sign in corner detection.
 */
const sideClockwise = (
  ax: number, ay: number, px: number, py: number, bx: number, by: number,
): boolean => (px - ax) * (by - ay) - (bx - ax) * (py - ay) < SIDE_EPS;

/** Java `MathRoutines.distanceToLine(pt, a, b)` (unsigned perpendicular). */
const sideDistToLine = (
  px: number, py: number, ax: number, ay: number, bx: number, by: number,
): number => {
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) + Math.abs(dy) < SIDE_EPS) return hypot(px - ax, py - ay);
  const a2 = (py - ay) * dx - (px - ax) * dy;
  return Math.sqrt((a2 * a2) / (dx * dx + dy * dy));
};

/** Java `MeasureGraph.discreteDirection(angle, numDir)`. */
const discreteDirection = (angle: number, numDir: number): number => {
  const arc = (2 * Math.PI) / numDir;
  const off = arc / 2;
  let a = angle;
  while (a < 0) a += 2 * Math.PI;
  while (a > 2 * Math.PI) a -= 2 * Math.PI;
  return (Math.floor((a + off) / arc) + numDir) % numDir;
};

/** Shoelace signed area of a closed polygon (positive ⇒ counter-clockwise). */
const polygonSignedArea = (poly: readonly [number, number][]): number => {
  let s = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i] as [number, number];
    const q = poly[(i + 1) % poly.length] as [number, number];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
};

/**
 * Ray-casting point-in-polygon test (Java `MathRoutines.pointInPolygon`). Used
 * by `measurePerimeter`'s nested-perimeter pruning: a connected component whose
 * boundary lies inside another component's polygon (an island within a hole) is
 * not part of the board perimeter and is dropped.
 */
const pointInPolygon = (
  x: number,
  y: number,
  poly: readonly [number, number][],
): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const pi = poly[i] as [number, number];
    const pj = poly[j] as [number, number];
    const intersect =
      pi[1] > y !== pj[1] > y &&
      x < ((pj[0] - pi[0]) * (y - pi[1])) / (pj[1] - pi[1]) + pi[0];
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Java `MeasureGraph.cornersFromPerimeter` — flag the perimeter positions that
 * are board corners. `poly` must be wound counter-clockwise (positive area) so
 * convex corners score positive, exactly as Java's perimeter does.
 */
const cornersFromPerimeter = (
  poly: readonly [number, number][],
): boolean[] => {
  const num = poly.length;
  const isCorner = new Array<boolean>(num).fill(false);
  if (num < 6) {
    for (let i = 0; i < num; i += 1) isCorner[i] = true;
    return isCorner;
  }
  const tol = 0.001;
  const numK = 4;
  const scores = new Array<number>(num).fill(0);
  for (let n = 0; n < num; n += 1) {
    const pt = poly[n] as [number, number];
    let score = 0;
    for (let k = 1; k < numK; k += 1) {
      const a = poly[(n - k + num) % num] as [number, number];
      const b = poly[(n + k) % num] as [number, number];
      let dist = sideDistToLine(pt[0], pt[1], a[0], a[1], b[0], b[1]);
      if (sideClockwise(a[0], a[1], pt[0], pt[1], b[0], b[1])) dist = -dist;
      score += dist / k;
    }
    scores[n] = score;
  }
  // Single smoothing pass.
  const temp = new Array<number>(num);
  for (let n = 0; n < num; n += 1) {
    temp[n] =
      (4 * (scores[n] as number) +
        (scores[(n + 1) % num] as number) +
        (scores[(n - 1 + num) % num] as number)) /
      6;
  }
  for (let n = 0; n < num; n += 1) scores[n] = temp[n] as number;
  // Convex corners.
  const keep = new Array<boolean>(num).fill(true);
  for (let n = 0; n < num; n += 1) {
    const s = scores[n] as number;
    if (
      s < 0.32 ||
      s < (scores[(n - 1 + num) % num] as number) - tol ||
      s < (scores[(n + 1) % num] as number) - tol
    )
      keep[n] = false;
  }
  const similar = 0.95;
  for (let n = 0; n < num; n += 1) {
    if (!keep[n]) continue;
    const s = scores[n] as number;
    if ((scores[(n - 1 + num) % num] as number) >= similar * s)
      keep[(n - 1 + num) % num] = true;
    if ((scores[(n + 1) % num] as number) >= similar * s)
      keep[(n + 1) % num] = true;
  }
  for (let n = 0; n < num; n += 1) if (keep[n]) isCorner[n] = true;
  // Concave corners.
  const keep2 = new Array<boolean>(num).fill(true);
  for (let n = 0; n < num; n += 1) {
    const s = scores[n] as number;
    if (
      s > -0.25 ||
      s > (scores[(n - 1 + num) % num] as number) + tol ||
      s > (scores[(n + 1) % num] as number) + tol
    )
      keep2[n] = false;
  }
  for (let n = 0; n < num; n += 1) if (keep2[n]) isCorner[n] = true;
  return isCorner;
};

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
  /**
   * Vertex ids of the outer (unbounded) face's boundary cycle — the board's
   * perimeter (Java MeasureGraph.measurePerimeter, which traces the boundary of
   * each connected component). Populated by `makeFaces`; the unbounded cycle is
   * the one with the most-negative signed area. Used for the geometric centre
   * and for `(sites Outer)` / `(sites Perimeter)` on graph boards.
   */
  private perimeterVerts: number[] = [];
  /**
   * The board perimeter split per connected component — one ordered vertex ring
   * for each disjoint block of the board (Java MeasureGraph.measurePerimeter
   * returns one Perimeter per connected component). `perimeterVerts` is the
   * flattened, de-duplicated union of these rings; the rings are kept separately
   * so corner/side measures, which require a single closed polygon, can run
   * per-component instead of on a meaningless concatenation. For the common
   * single-component board this is exactly `[perimeterVerts]`.
   */
  private perimeterRings: number[][] = [];
  /**
   * Vertex id → pivot vertex id, for the circular (concentric) basis. Java
   * `Vertex.setPivot` — the centre/inner vertex each ring vertex rotates around.
   * Sparse: present only for pivoted boards; consumed by the Trajectories core
   * to derive In/Out/CW/CCW (Rotational) directions.
   */
  private pivotIds = new Map<number, number>();

  public get vertices(): readonly GVertex[] {
    return this.vlist;
  }
  public get edges(): readonly GEdge[] {
    return this.elist;
  }
  public get faces(): readonly GFace[] {
    return this.flist;
  }
  public get perimeter(): readonly number[] {
    return this.perimeterVerts;
  }

  /**
   * The board perimeter as ordered vertex rings, one per connected component
   * (Java `MeasureGraph.measurePerimeter`, which returns one Perimeter per
   * component). Consecutive vertices in each ring (with wrap-around) are the
   * boundary edges — used by `(sites Outer Edge)` to reproduce Java's
   * `edge.properties().set(PERIMETER)` walk. Falls back to a single ring from
   * `perimeterVerts` when the per-component split was not computed.
   */
  public get perimeterRingList(): readonly (readonly number[])[] {
    if (this.perimeterRings.length > 0) return this.perimeterRings;
    return this.perimeterVerts.length > 0 ? [this.perimeterVerts] : [];
  }

  /**
   * Vertex ids flagged as board corners — Java `MeasureGraph.measureCorners` /
   * `cornersFromPerimeter` for the VERTEX site type (a vertex is CORNER when its
   * perimeter position is a turning point of the boundary polygon). Computed
   * from the same CCW-oriented perimeter ring `measureSides` uses, so the corner
   * set is consistent with the per-side classification. Empty for lattice boards
   * (no perimeter). Vertex-play games consume this for `(sites Corners Vertex)`.
   */
  public cornerVertices(): number[] {
    if (this.vlist.length === 0) return [];
    // Corners must be measured on a single closed polygon, so process each
    // connected component's perimeter ring independently (a concatenation of
    // several rings would yield meaningless turning points). Single-component
    // boards have exactly one ring, reproducing the previous behaviour.
    const rings =
      this.perimeterRings.length > 0
        ? this.perimeterRings
        : this.perimeterVerts.length > 0
          ? [this.perimeterVerts]
          : [];
    const out = new Set<number>();
    for (const ring of rings) {
      // Orient CCW (positive signed area) to match Java, so convex corners
      // score positive in cornersFromPerimeter — identical preprocessing to
      // measureSides.
      let perim = [...ring];
      let poly: [number, number][] = perim.map((vid) => {
        const v = this.vlist[vid] as GVertex;
        return [v.x, v.y];
      });
      if (polygonSignedArea(poly) < 0) {
        perim = perim.reverse();
        poly = perim.map((vid) => {
          const v = this.vlist[vid] as GVertex;
          return [v.x, v.y];
        });
      }
      const isCorner = cornersFromPerimeter(poly);
      for (let n = 0; n < perim.length; n += 1)
        if (isCorner[n]) out.add(perim[n] as number);
    }
    return [...out].sort((a, b) => a - b);
  }

  /** Record vertex `vid`'s pivot (Java `Vertex.setPivot`). */
  public setPivot(vid: number, pivotVid: number): void {
    if (vid !== pivotVid) this.pivotIds.set(vid, pivotVid);
  }
  /** Pivot vertex id of `vid`, or -1 if none. */
  public getPivot(vid: number): number {
    return this.pivotIds.get(vid) ?? -1;
  }
  /** All (vertexId → pivotVertexId) entries, for topology ingestion. */
  public get pivots(): ReadonlyMap<number, number> {
    return this.pivotIds;
  }

  /**
   * A copy of this graph with every vertex (and face centroid) coordinate run
   * through `fn`, preserving the existing faces, edges, perimeter and pivots
   * 1:1 — the faithful analogue of Java `Graph.rotate/shift/scale/skew`, which
   * mutate vertex positions in place and never rebuild the face list. Used by
   * the `(rotate …)` / `(shift …)` / `(scale …)` / `(skew …)` operators.
   *
   * Crucially this keeps a prior `(remove … cells:{…})` / `(hole …)`: those
   * delete faces but keep the bordering vertices/edges, so re-running
   * `makeFaces` after a transform would resurrect the deleted faces. Because the
   * operators here are affine, they preserve the planar embedding's angular
   * adjacency — so on a graph that was NOT pruned, the preserved faces are
   * byte-identical to what `makeFaces` would recompute (no behaviour change for
   * unpruned boards). `fn` is affine, so a face's vertex-average centroid maps
   * to the transformed centroid.
   */
  public withTransformedCoordinates(
    fn: (x: number, y: number) => readonly [number, number],
  ): Graph {
    const out = new Graph();
    out.vlist = this.vlist.map((v) => {
      const [x, y] = fn(v.x, v.y);
      return v.z !== undefined ? { id: v.id, x, y, z: v.z } : { id: v.id, x, y };
    });
    out.elist = this.elist.map((e) => ({ id: e.id, a: e.a, b: e.b }));
    out.edgeKey = new Map(this.edgeKey);
    out.flist = this.flist.map((f) => {
      const [cx, cy] = fn(f.cx, f.cy);
      return { id: f.id, vertices: f.vertices, cx, cy };
    });
    out.perimeterVerts = [...this.perimeterVerts];
    out.perimeterRings = this.perimeterRings.map((r) => [...r]);
    out.pivotIds = new Map(this.pivotIds);
    return out;
  }

  /**
   * Append a vertex at (x, y, z) WITHOUT the 2-D coincidence dedup that
   * {@link addVertex} performs. The pyramidal (Shibumi) board stacks layers
   * whose 2-D projections overlap (e.g. the layer-0 and layer-2 points both at
   * (1, 1)); those are distinct play sites and must not be merged. Adjacency on
   * such boards is built only within a layer, so the overlapping projections
   * never interact in the trajectory/face machinery.
   */
  public pushVertex3D(x: number, y: number, z: number): number {
    const id = this.vlist.length;
    this.vlist.push({ id, x, y, z });
    return id;
  }

  /**
   * @java Graph.findOrAddVertex(x, y, z) — 3-D-aware dedup: pyramid layers
   * project onto base coordinates (layer-2 (1,1,2dz) sits exactly above base
   * (1,1,0)) and must stay distinct vertices.
   */
  public findOrAddVertex3D(x: number, y: number, z: number, tol = VERTEX_TOL): number {
    for (const v of this.vlist) {
      if (coincident(v.x - x, v.y - y, tol) && Math.abs((v.z ?? 0) - z) < tol) return v.id;
    }
    const id = this.vlist.length;
    this.vlist.push({ id, x, y, z });
    return id;
  }

  /**
   * @java Graph.makeEdges() — join every vertex pair at 3-D distance ~ the
   * unit (|dist - 1| < 0.05). The pyramidal generator calls this after
   * stacking layers: a layer vertex at (c+.5, r+.5, 1/sqrt(2)) is exactly
   * unit distance from its four base supports and its in-layer neighbours.
   */
  public makeEdges(): void {
    for (let a = 0; a < this.vlist.length; a += 1) {
      const va = this.vlist[a]!;
      for (let b = a + 1; b < this.vlist.length; b += 1) {
        const vb = this.vlist[b]!;
        const dx = va.x - vb.x;
        const dy = va.y - vb.y;
        const dz = (va.z ?? 0) - (vb.z ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - 1) < 0.05) this.addEdge(a, b);
      }
    }
  }

  /**
   * Append a vertex unconditionally, WITHOUT coincidence dedup. Mirrors Java
   * `Graph.addVertex(Vertex)` (`vertices.add(vertex)`), which never fuses
   * coincident points. Used by the `(union …)` operator: Java's union keeps
   * each sub-graph's vertices distinct even where they coincide, so a
   * `(union (square 9) (scale 3 (square 3)))` board does NOT share edges/faces
   * across the two sub-graphs (Ultimate Tic-Tac-Toe: the 9 SuperGame meta-cells
   * must not become adjacent to the 81 sub-cells).
   */
  public addVertexRaw(x: number, y: number): number {
    const id = this.vlist.length;
    this.vlist.push({ id, x, y });
    return id;
  }

  /** Find an existing vertex within `tol` of (x, y), else add a new one. */
  public addVertex(x: number, y: number, tol = VERTEX_TOL): number {
    for (const v of this.vlist) {
      if (coincident(v.x - x, v.y - y, tol)) return v.id;
    }
    const id = this.vlist.length;
    this.vlist.push({ id, x, y });
    return id;
  }

  /**
   * Find the id of an existing vertex within `tol` of (x, y), or -1. Java
   * parity: `Graph.findVertex(x, y, z)` — operators that take endpoint
   * *coordinates* (e.g. `(remove edges:{ {{0 0}{1 1}} })`) resolve them to
   * vertex ids this way before touching the edge list.
   */
  public findVertex(x: number, y: number, tol = VERTEX_TOL): number {
    for (const v of this.vlist) {
      if (coincident(v.x - x, v.y - y, tol)) return v.id;
    }
    return -1;
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

    const areas = cycles.map((c) => signedArea(c));

    // Connected components (union-find over edges): each disjoint block of the
    // board owns its own outer boundary. Java MeasureGraph.measurePerimeter
    // traces ONE perimeter per connected component, not a single global one —
    // essential for merged/disjoint boards (e.g. two-row mancala whose play
    // sites form several disconnected rectangles), where a single global
    // perimeter would cover only one block and misplace `(sites Centre)` /
    // `(sites Perimeter)` / `(sites Outer)`.
    const parent = this.vlist.map((_, i) => i);
    const find = (x: number): number => {
      let r = x;
      while ((parent[r] as number) !== r) r = parent[r] as number;
      while ((parent[x] as number) !== r) {
        const nx = parent[x] as number;
        parent[x] = r;
        x = nx;
      }
      return r;
    };
    for (const e of this.elist) {
      const ra = find(e.a);
      const rb = find(e.b);
      if (ra !== rb) parent[ra] = rb;
    }

    // Per component, the most-negative (clockwise) cycle is its outer boundary.
    const outerByComp = new Map<number, number>(); // compRoot -> cycle index
    for (let i = 0; i < cycles.length; i += 1) {
      const ar = areas[i] as number;
      if (ar >= 0) continue; // only clockwise (outer) cycles
      const root = find((cycles[i] as number[])[0] as number);
      const cur = outerByComp.get(root);
      if (cur === undefined || ar < (areas[cur] as number))
        outerByComp.set(root, i);
    }
    let outerRings = [...outerByComp.values()].map((i) => cycles[i] as number[]);

    // Drop a component's outer ring when it lies inside another's polygon — an
    // island within a hole is not part of the board perimeter (Java
    // MeasureGraph removes perimeter A when its start point is inside polygon B).
    const ringPoly = (ring: readonly number[]): [number, number][] =>
      ring.map((vid) => {
        const v = this.vlist[vid] as GVertex;
        return [v.x, v.y] as [number, number];
      });
    outerRings = outerRings.filter((ringA) => {
      const a0 = this.vlist[ringA[0] as number] as GVertex;
      for (const ringB of outerRings) {
        if (ringB === ringA) continue;
        if (pointInPolygon(a0.x, a0.y, ringPoly(ringB))) return false;
      }
      return true;
    });

    this.perimeterRings = outerRings.map((r) => [...r]);
    this.perimeterVerts = [...new Set(outerRings.flat())];

    // @java Graph.makeFaces:1328-1422 — faces are discovered VERTEX-major:
    // for each vertex in id order, for each of its edges in ascending-angle
    // order, walk taking the next edge in rotation ((n+m) % numEdges) at
    // every vertex until the cycle closes back at the start; record the
    // polygon when it is clockwise (negative shoelace, MathRoutines
    // .clockwise) and unseen. Face ids follow THIS discovery order — the
    // recorded trials index cells of merged boards by it (Laram Wali's
    // cross interleaves arm/bar cells at the junctions; our previous
    // edge-major enumeration numbered those pairs the other way around).
    // The cap: the walk runs `while (vertIds.size() <= 32)`, so any cycle
    // needing more than MAX_FACE_SIDES vertices never closes and is never
    // a face (drops the 62-sided channel in Kawade Kelia, 46 in Panchi).
    const MAX_FACE_SIDES = 32;
    const seen = new Set<string>();
    const addFace = (cyc: readonly number[]): void => {
      const key = [...cyc].sort((a, b) => a - b).join(",");
      if (seen.has(key)) return; // @java Graph.containsFace
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
        vertices: [...cyc],
        cx: cx / cyc.length,
        cy: cy / cyc.length,
      });
    };
    for (let s = 0; s < this.vlist.length; s += 1) {
      const listS = adj[s];
      if (!listS || listS.length === 0) continue;
      for (let ei = 0; ei < listS.length; ei += 1) {
        // @java the walk state is (vert, edge); `eOther` is the edge's other
        // endpoint. The first step leaves vertexStart along the edge AFTER
        // edgeStart in rotation, not edgeStart itself (m starts at 1).
        const vertIds: number[] = [s];
        let cur = s;
        let eOther = listS[ei]!.to;
        let closed = false;
        // @java Graph.makeFaces:1367-1373 — faces are PLANAR: the walk only
        // follows edges whose far endpoint shares the start vertex's z
        // (|dz| < 0.0001). Pyramidal boards stack layers joined by 3-D unit
        // edges; without this guard the walk wanders between layers.
        const zStart = this.vlist[s]?.z ?? 0;
        while (vertIds.length <= MAX_FACE_SIDES) {
          const list = adj[cur];
          // @java the m-loop runs m=1..numEdges-1: a degree-1 vertex has no
          // next edge in rotation and the walk dies.
          if (!list || list.length < 2) break;
          const n = indexOf(cur, eOther);
          if (n < 0) break;
          let next = -1;
          for (let m = 1; m < list.length; m += 1) {
            const cand = list[(n + m) % list.length]!.to;
            if (Math.abs((this.vlist[cand]?.z ?? 0) - zStart) < 0.0001) {
              next = cand;
              break;
            }
          }
          if (next < 0) break; // no next CW edge on the start plane
          eOther = cur;
          cur = next;
          if (cur === s) {
            closed = true;
            break;
          }
          if (vertIds.includes(cur)) break; // self-intersection without closure
          vertIds.push(cur);
        }
        if (closed && vertIds.length >= 3) {
          // @java MathRoutines.clockwise(poly) — negative shoelace area.
          let area = 0;
          for (let i = 0; i < vertIds.length; i += 1) {
            const p = this.vlist[vertIds[i] as number];
            const q = this.vlist[vertIds[(i + 1) % vertIds.length] as number];
            if (p && q) area += p.x * q.y - q.x * p.y;
          }
          if (area / 2 < 0) addFace(vertIds);
        }
      }
    }
  }

  /**
   * Remove the faces at the given indices and renumber the survivors, without
   * rebuilding the face list — @java Graph.removeFace, called by the `(remove …
   * cells:{…})` / `Cells:{…}` operator. Java sorts the indices descending and
   * removes one at a time decrementing the trailing ids; filtering then
   * re-id-ing the survivors in their existing order is equivalent and preserves
   * the canonical y·100+x face numbering the recorded trials reference. Vertices
   * and edges are deliberately kept (Java only trims edges orphaned by the
   * removal when `trimEdges`, and an orphaned edge — bordering no surviving face
   * — cannot change adjacency among the surviving faces), and `makeFaces` is NOT
   * re-run (Java comment: "Do not create faces! That would just restore any
   * deleted faces").
   */
  public removeFacesByIndex(indices: readonly number[]): void {
    const drop = new Set(indices.filter((i) => i >= 0 && i < this.flist.length));
    if (drop.size === 0) return;
    this.flist = this.flist
      .filter((f) => !drop.has(f.id))
      .map((f, i) => ({ id: i, vertices: f.vertices, cx: f.cx, cy: f.cy }));
    // @java Graph.removeFace(fid, removeOrphans) trims edges orphaned by the
    // removal, so Java's perimeter (traced over boundary EDGES) never runs
    // through the removed area. TS keeps the edges (adjacency among surviving
    // faces is unaffected) but must RETRACE the perimeter from the surviving
    // faces — the stale ring bulged around the removed cells, corner scoring
    // peaked on orphan vertices touching no face, and every side of Shafran
    // Chess' clipped hexagon came back empty (the pawn's promotion-zone
    // moveAgain then never fired).
    this.recomputePerimeterFromFaces();
  }

  /**
   * Retrace the board perimeter from the CURRENT face list: a boundary edge
   * borders exactly one face; walk boundary edges into closed rings and keep
   * every ring not contained in another (holes from interior removals are
   * dropped, matching @java MeasureGraph.measurePerimeter's outer-cycle pick).
   */
  private recomputePerimeterFromFaces(): void {
    if (this.flist.length === 0) return;
    const edgeCount = new Map<string, number>();
    const key = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
    for (const f of this.flist) {
      const vs = f.vertices;
      for (let n = 0; n < vs.length; n += 1) {
        const k = key(vs[n] as number, vs[(n + 1) % vs.length] as number);
        edgeCount.set(k, (edgeCount.get(k) ?? 0) + 1);
      }
    }
    // Boundary adjacency: vertex -> neighbours over single-face edges.
    const nbors = new Map<number, number[]>();
    for (const [k, c] of edgeCount) {
      if (c !== 1) continue;
      const [a, b] = k.split(":").map(Number) as [number, number];
      (nbors.get(a) ?? nbors.set(a, []).get(a)!).push(b);
      (nbors.get(b) ?? nbors.set(b, []).get(b)!).push(a);
    }
    const visited = new Set<string>();
    const rings: number[][] = [];
    for (const [start, startNbors] of nbors) {
      for (const first of startNbors) {
        if (visited.has(`${start}:${first}`)) continue;
        const ring = [start];
        let prev = start;
        let cur = first;
        visited.add(`${start}:${first}`);
        let guard = nbors.size * 4;
        while (cur !== start && guard-- > 0) {
          ring.push(cur);
          const nb = nbors.get(cur) ?? [];
          const nxt = nb.find((n) => n !== prev && !visited.has(`${cur}:${n}`));
          if (nxt === undefined) break;
          visited.add(`${cur}:${nxt}`);
          prev = cur;
          cur = nxt;
        }
        if (cur === start && ring.length >= 3) rings.push(ring);
      }
    }
    if (rings.length === 0) return;
    // Drop rings contained in another ring (holes).
    const poly = (ring: readonly number[]): [number, number][] =>
      ring.map((vid) => {
        const v = this.vlist[vid] as GVertex;
        return [v.x, v.y] as [number, number];
      });
    const outer = rings.filter((ringA) => {
      const a = this.vlist[ringA[0] as number] as GVertex;
      for (const ringB of rings) {
        if (ringB === ringA) continue;
        if (pointInPolygon(a.x, a.y, poly(ringB))) return false;
      }
      return true;
    });
    if (outer.length === 0) return;
    this.perimeterRings = outer.map((r) => [...r]);
    this.perimeterVerts = [...new Set(outer.flat())];
  }

  /**
   * @java game.util.graph.Graph.findOrAddFace — append a face whose boundary is
   * the given vertex-id ring, used by the `(add … cells:{…} / Cells:{…})`
   * operator. Faithful to Java: needs ≥ 3 vertices, every boundary edge (vid[n]
   * → vid[n+1]) must ALREADY exist (Java refuses to create edges here — it would
   * crash face creation — and returns null), and a face already matching the
   * ring is returned unchanged rather than duplicated. The new face is appended
   * at the end (id = flist.length) and is NOT renumbered/reordered — `Add.eval`
   * only resets the basis/shape tags — so it follows the existing canonical
   * faces, exactly where recorded trials reference it. Returns true if a face
   * was added (or already present).
   */
  public findOrAddFace(vertIds: readonly number[]): boolean {
    if (vertIds.length < 3 || vertIds.length > this.vlist.length) return false;
    for (const vid of vertIds)
      if (vid < 0 || vid >= this.vlist.length) return false;
    // Existing face with the same vertex set (order-independent) — keep it.
    const want = new Set(vertIds);
    for (const f of this.flist)
      if (
        f.vertices.length === vertIds.length &&
        f.vertices.every((v) => want.has(v))
      )
        return true;
    // Every boundary edge must already exist (Java refuses to add one here).
    for (let n = 0; n < vertIds.length; n += 1) {
      const a = vertIds[n] as number;
      const b = vertIds[(n + 1) % vertIds.length] as number;
      if (!this.hasEdge(a, b)) return false;
    }
    let cx = 0;
    let cy = 0;
    for (const vid of vertIds) {
      const v = this.vlist[vid] as GVertex;
      cx += v.x;
      cy += v.y;
    }
    this.flist.push({
      id: this.flist.length,
      vertices: [...vertIds],
      cx: cx / vertIds.length,
      cy: cy / vertIds.length,
    });
    return true;
  }

  /**
   * @java game.functions.graph.operators.Subdivide — split every cell with at
   * least `min` sides about its centroid: add a pivot vertex at the face's
   * `pt()` (centroid) and a spoke edge from it to each face vertex, turning an
   * N-gon into N triangles. Mirrors `Subdivide.eval` exactly:
   *
   *  - Vertex play (`cellMode` false): `makeFaces` first ("can't subdivide
   *    without any faces"), add pivots+spokes, then `clear(SiteType.Cell)` —
   *    the resulting board is the vertex set (originals followed by the
   *    appended pivots) plus the spoke edges, with no cells.
   *  - Cell play (`cellMode` true): add pivots+spokes to the existing faces,
   *    remove the subdivided faces, then rebuild the (now triangular) faces.
   *
   * Pivots are appended after the original vertices in face order (high→low
   * fid), and the graph is deliberately NOT reordered afterward — Java's
   * `resetBasis()` only clears the basis tag — so the recorded trials' site
   * indices line up with `addVertex`'s append order.
   */
  public subdivide(min: number, siteType: string): void {
    // @java Subdivide.eval:66-67 — makeFaces runs ONLY for Vertex play
    // ("can't subdivide without any faces!"). Edge play must NOT makeFaces: an
    // edge-use board (e.g. Windir's octagram K_8) has no faces, and discovering
    // them here adds a spurious centroid pivot vertex + spokes, inflating K_8 to
    // K_9 so (is RegularGraph …) never sees uniform degrees. The old `!cellMode`
    // guard grouped Edge with Vertex and wrongly ran makeFaces for both.
    const cellMode = siteType === "Cell";
    if (siteType === "Vertex") this.makeFaces();

    // Snapshot the faces eligible for subdivision (≥ min sides). The flist is
    // not mutated inside the loop — we only addVertex/addEdge — so these fids
    // stay valid against the current list, matching Java's high→low walk.
    const subdivided: number[] = [];
    for (let fid = this.flist.length - 1; fid >= 0; fid -= 1) {
      const face = this.flist[fid];
      if (!face || face.vertices.length < min) continue;
      const pivot = this.addVertex(face.cx, face.cy);
      for (const vid of face.vertices) this.addEdge(pivot, vid);
      subdivided.push(fid);
    }

    if (cellMode) {
      // Drop the subdivided faces, then rebuild from the augmented edge set so
      // the new triangular cells are detected (untouched cells are re-found
      // unchanged). Java removes flagged faces *before* makeFaces so shared
      // boundary edges survive; our makeFaces rebuilds from edges directly.
      this.removeFacesByIndex(subdivided);
      this.makeFaces();
    } else {
      // Java graph.clear(SiteType.Cell): Vertex play keeps no cells.
      this.flist = [];
      this.perimeterVerts = [];
      this.perimeterRings = [];
    }
  }

  /**
   * @java Graph.trim() — remove orphan edges, then orphan (edgeless) non-pivot
   * vertices. An *orphan edge* is a dangling spur: an edge one of whose
   * endpoints has only that single incident edge. Java walks edges high→low,
   * removing any with a live degree-1 endpoint and decrementing both endpoints'
   * degrees as it goes (so a spur of length k peels back one edge per pass step
   * from its free end). It then drops every vertex left with no incident edge,
   * except pivot targets. Vertices are renumbered by the removal, exactly like
   * `removeVertex` shifting trailing ids; run this before `reorder()` /
   * Trajectories ingestion. Faces survive (their boundary vertices keep degree
   * ≥ 2), but any face referencing a removed vertex is dropped defensively.
   */
  public trim(): void {
    const deg = new Array<number>(this.vlist.length).fill(0);
    for (const e of this.elist) {
      deg[e.a] = (deg[e.a] ?? 0) + 1;
      deg[e.b] = (deg[e.b] ?? 0) + 1;
    }
    const edgeKept = new Array<boolean>(this.elist.length).fill(true);
    for (let i = this.elist.length - 1; i >= 0; i -= 1) {
      const e = this.elist[i] as GEdge;
      if (deg[e.a] === 1 || deg[e.b] === 1) {
        edgeKept[i] = false;
        deg[e.a] = (deg[e.a] ?? 0) - 1;
        deg[e.b] = (deg[e.b] ?? 0) - 1;
      }
    }
    const survivingEdges = this.elist.filter((_, i) => edgeKept[i]);
    const pivotTargets = new Set<number>();
    for (const [, p] of this.pivotIds) pivotTargets.add(p);
    // Renumber surviving vertices in their existing order (drop edgeless
    // non-pivots). `deg` now holds the post-trim incident count.
    const remap = new Array<number>(this.vlist.length).fill(-1);
    const newV: GVertex[] = [];
    for (const v of this.vlist) {
      if ((deg[v.id] ?? 0) > 0 || pivotTargets.has(v.id)) {
        remap[v.id] = newV.length;
        newV.push({ id: newV.length, x: v.x, y: v.y, z: v.z });
      }
    }
    if (newV.length === this.vlist.length && survivingEdges.length === this.elist.length)
      return; // nothing to trim — leave ids untouched
    this.vlist = newV;
    this.elist = survivingEdges.map((e, i) => ({
      id: i,
      a: remap[e.a] as number,
      b: remap[e.b] as number,
    }));
    this.edgeKey.clear();
    for (const e of this.elist) {
      const key = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
      this.edgeKey.set(key, e.id);
    }
    if (this.pivotIds.size > 0) {
      const np = new Map<number, number>();
      for (const [k, p] of this.pivotIds) {
        const nk = remap[k] as number;
        const npv = remap[p] as number;
        if (nk >= 0 && npv >= 0) np.set(nk, npv);
      }
      this.pivotIds = np;
    }
    if (this.perimeterRings.length > 0) {
      this.perimeterRings = this.perimeterRings
        .map((r) => r.map((v) => remap[v] as number).filter((v) => v >= 0))
        .filter((r) => r.length > 0);
      this.perimeterVerts = [...new Set(this.perimeterRings.flat())];
    } else if (this.perimeterVerts.length > 0) {
      this.perimeterVerts = this.perimeterVerts
        .map((v) => remap[v] as number)
        .filter((v) => v >= 0);
    }
    if (this.flist.length > 0)
      this.flist = this.flist
        .filter((f) => f.vertices.every((v) => (remap[v] as number) >= 0))
        .map((f, i) => ({
          id: i,
          vertices: f.vertices.map((v) => remap[v] as number),
          cx: f.cx,
          cy: f.cy,
        }));
  }

  /**
   * Reorder vertices (and remap edges) bottom-to-top, left-to-right — Java's
   * `Graph.reorder()` sort key `y * 100 + x` (ItemScore, ascending). Using the
   * *combined* score rather than lexicographic (y, then x) is essential: when
   * two vertices share a y that only differs by floating-point noise (e.g. the
   * symmetric points of a regular star), the `*100` weighting still lets x
   * dominate the tie exactly as Java does, instead of letting the noise decide.
   * Any existing faces are remapped and re-sorted too (Java
   * `reorder(SiteType.Cell)`), so calling this after `makeFaces` keeps the
   * three element lists mutually consistent and in Java's canonical order.
   */
  public reorder(): void {
    const order = [...this.vlist].sort(
      (p, q) => (p.y * 100 + p.x) - (q.y * 100 + q.x),
    );
    const remap = new Array<number>(this.vlist.length);
    order.forEach((v, i) => {
      remap[v.id] = i;
    });
    // z rides along (the y*100+x score deliberately ignores it — Java
    // reorder() scores 2-D; ties stay in insertion order via stable sort).
    this.vlist = order.map((v, i) => (v.z !== undefined ? { id: i, x: v.x, y: v.y, z: v.z } : { id: i, x: v.x, y: v.y }));
    // Remap endpoints, then reorder edges by midpoint score — Java
    // `reorder(SiteType.Edge)` uses each edge's `pt()` (midpoint) under the same
    // `y*100+x` key. Canonical edge order matters for `use:Edge` site indices
    // and for the deterministic crossing-discovery order in `splitCrossings`.
    const remapped = this.elist.map((e) => ({
      a: remap[e.a] as number,
      b: remap[e.b] as number,
    }));
    const midScore = (e: { a: number; b: number }): number => {
      const va = this.vlist[e.a] as GVertex;
      const vb = this.vlist[e.b] as GVertex;
      const my = (va.y + vb.y) / 2;
      const mx = (va.x + vb.x) / 2;
      return my * 100 + mx;
    };
    remapped.sort((e1, e2) => midScore(e1) - midScore(e2));
    this.elist = remapped.map((e, i) => ({ id: i, a: e.a, b: e.b }));
    this.edgeKey.clear();
    for (const e of this.elist) {
      const key = e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`;
      this.edgeKey.set(key, e.id);
    }
    // The perimeter rings are stored as vertex ids (computed in makeFaces,
    // which may run before reorder); remap so they keep pointing at the same
    // vertices after renumbering. Within-ring order is preserved (corner/side
    // measures need the closed-ring sequence); the flat union is rederived.
    if (this.perimeterRings.length > 0) {
      this.perimeterRings = this.perimeterRings.map((r) =>
        r.map((v) => remap[v] as number),
      );
      this.perimeterVerts = [...new Set(this.perimeterRings.flat())];
    } else if (this.perimeterVerts.length > 0) {
      this.perimeterVerts = this.perimeterVerts.map((v) => remap[v] as number);
    }
    // Remap each face's vertex cycle through the new ids and re-sort faces by
    // centroid score — Java `reorder(SiteType.Cell)` uses each face's `pt()`
    // (centroid) under the same `y*100+x` key. A no-op when no faces exist yet.
    if (this.flist.length > 0) {
      const faces = this.flist.map((f) => ({
        vertices: f.vertices.map((v) => remap[v] as number),
        cx: f.cx,
        cy: f.cy,
      }));
      faces.sort((a, b) => (a.cy * 100 + a.cx) - (b.cy * 100 + b.cx));
      this.flist = faces.map((f, i) => ({
        id: i,
        vertices: f.vertices,
        cx: f.cx,
        cy: f.cy,
      }));
    }
  }

  /**
   * Renumber faces (cells) by centroid score `y·100 + x` ascending, reassigning
   * ids — the faithful analogue of Java `Graph.reorder(SiteType.Cell)`, invoked
   * by the `(renumber Cell …)` operator. Vertices and edges are untouched (so a
   * face's stored vertex-id cycle stays valid); only the face *order* and ids
   * change. Needed after a `(rotate …)` that preserved faces in their
   * pre-rotation order: the explicit `Cell` renumber re-sorts them by their new
   * post-rotation positions (e.g. Xiang Hex). A no-op when no faces exist.
   */
  public reorderFaces(): void {
    if (this.flist.length === 0) return;
    const faces = [...this.flist].sort(
      (a, b) => a.cy * 100 + a.cx - (b.cy * 100 + b.cx),
    );
    this.flist = faces.map((f, i) => ({
      id: i,
      vertices: f.vertices,
      cx: f.cx,
      cy: f.cy,
    }));
  }

  /**
   * Compass sides of the board — Java `MeasureGraph.measureSides` (run after
   * corners). The perimeter is split into runs between corner vertices; each
   * run is assigned the compass side of its average position relative to the
   * graph centroid (`discreteDirection`, 16 sectors). Every perimeter vertex
   * inherits its run's side(s) — a corner vertex sits in two runs and so carries
   * both adjacent sides — and each face/vertex element then takes the union of
   * the sides of its perimeter vertices.
   *
   * This is the faithful replacement for the bounding-box row/column heuristic:
   * on a slanted board (rhombus Hex, triangle, …) the four sides are diagonal
   * edges, so `(sites Side NE)` must follow the actual perimeter, not row h-1.
   * Returns both Cell (face) and Vertex side maps so either play type can use it.
   */
  public measureSides(): GraphSides {
    const cell = new Map<string, number[]>();
    const vertex = new Map<string, number[]>();
    if (this.perimeterVerts.length === 0 || this.vlist.length === 0)
      return { cell, vertex };

    // Centroid = mean of all vertex positions (Java Graph.centroid()).
    let midx = 0;
    let midy = 0;
    for (const v of this.vlist) {
      midx += v.x;
      midy += v.y;
    }
    midx /= this.vlist.length;
    midy /= this.vlist.length;

    // Orient the perimeter counter-clockwise (positive area) to match Java, so
    // convex corners score positive in cornersFromPerimeter.
    let perim = [...this.perimeterVerts];
    let poly: [number, number][] = perim.map((vid) => {
      const v = this.vlist[vid] as GVertex;
      return [v.x, v.y];
    });
    if (polygonSignedArea(poly) < 0) {
      perim = perim.reverse();
      poly = perim.map((vid) => {
        const v = this.vlist[vid] as GVertex;
        return [v.x, v.y];
      });
    }

    const num = poly.length;
    const isCorner = cornersFromPerimeter(poly);

    // Side bit for one perimeter run (Java sideFromRun): average run position,
    // its discrete direction from the centroid, mapped to a compass name.
    const sideForRun = (from: number, runLength: number): string => {
      let avgX = (poly[from] as [number, number])[0];
      let avgY = (poly[from] as [number, number])[1];
      for (let r = 0; r < runLength; r += 1) {
        const ge = poly[(from + 1 + r) % num] as [number, number];
        avgX += ge[0];
        avgY += ge[1];
      }
      avgX /= runLength + 1;
      avgY /= runLength + 1;
      const dirn = discreteDirection(Math.atan2(avgY - midy, avgX - midx), 16);
      if (dirn === 0) return "E";
      if (dirn === 4) return "N";
      if (dirn === 8) return "W";
      if (dirn === 12) return "S";
      if (dirn > 0 && dirn < 4) return "NE";
      if (dirn > Math.floor(dirn / 4) && dirn < 8) return "NW";
      if (dirn > Math.floor(dirn / 2) && dirn < 12) return "SW";
      return "SE";
    };

    // Walk each run between consecutive corners and tag its vertices.
    const vidSide = new Map<number, Set<string>>();
    const tag = (vid: number, side: string): void => {
      let set = vidSide.get(vid);
      if (!set) {
        set = new Set<string>();
        vidSide.set(vid, set);
      }
      set.add(side);
    };
    for (let from = 0; from < num; from += 1) {
      if (!isCorner[from]) continue;
      let to = from;
      do {
        to = (to + 1) % num;
      } while (!isCorner[to] && to !== from);
      let runLength = (to - from + num) % num;
      if (runLength === 0) runLength = num;
      const side = sideForRun(from, runLength);
      for (let r = 0; r < runLength + 1; r += 1) {
        tag(perim[(from + r) % num] as number, side);
      }
    }

    const push = (map: Map<string, number[]>, side: string, id: number): void => {
      let arr = map.get(side);
      if (!arr) {
        arr = [];
        map.set(side, arr);
      }
      arr.push(id);
    };

    // Vertex sides: each tagged perimeter vertex directly.
    for (const [vid, sides] of vidSide) {
      for (const side of sides) push(vertex, side, vid);
    }
    for (const arr of vertex.values()) arr.sort((a, b) => a - b);

    // Cell (face) sides: a face is on side X iff it has a perimeter vertex on X.
    this.flist.forEach((f) => {
      const sides = new Set<string>();
      for (const vid of f.vertices) {
        const s = vidSide.get(vid);
        if (s) for (const side of s) sides.add(side);
      }
      for (const side of sides) push(cell, side, f.id);
    });
    for (const arr of cell.values()) arr.sort((a, b) => a - b);

    return { cell, vertex };
  }
}
