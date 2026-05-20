/**
 * Geometric direction & radial computation for a planar {@link Graph} — Java
 * parity with Core/src/game/util/graph/trajectory/Trajectories.java.
 *
 * The legacy lattice board reaches a neighbour by adding a fixed `(dx, dy)`
 * offset. A general graph has no lattice, so neighbours and their compass
 * directions are derived from the embedding: each play-site (a face for
 * `use:Cell`, a vertex for `use:Vertex`) gets the list of its adjacent sites,
 * and the direction to each is the compass sector of the angle between their
 * positions. Radials (rays for sliding moves) are then built by repeatedly
 * stepping in the same compass direction.
 */

import { type GFace, type Graph } from "./graph.js";

export type SiteKind = "Cell" | "Vertex";

/** 8-sector compass names, indexed so sector 0 = East and they rotate CCW. */
const COMPASS8 = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"] as const;

const ORTHO = new Set(["N", "E", "S", "W"]);

/** Bin an angle (radians) to one of the 8 compass names. */
function compassOf(dx: number, dy: number): string {
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI; // (-180, 180]
  if (deg < 0) deg += 360;
  const idx = Math.round(deg / 45) % 8;
  return COMPASS8[idx] as string;
}

interface SiteAdj {
  /** direction name → neighbour site (nearest, on collision). */
  readonly byDir: Map<string, number>;
  /** all orthogonal-adjacency neighbours (edge-sharing). */
  readonly orthogonal: readonly number[];
  /** all diagonal-adjacency neighbours (corner-only sharing). */
  readonly diagonal: readonly number[];
}

/**
 * Adjacency + direction tables for a graph viewed as a set of play-sites.
 * `numSites` is the count of faces (Cell) or vertices (Vertex). Methods take a
 * site index in `[0, numSites)`.
 */
export class Trajectories {
  public readonly kind: SiteKind;
  public readonly numSites: number;
  public readonly xs: readonly number[];
  public readonly ys: readonly number[];
  private readonly adj: readonly SiteAdj[];

  public constructor(graph: Graph, kind: SiteKind) {
    this.kind = kind;
    const xs: number[] = [];
    const ys: number[] = [];
    if (kind === "Vertex") {
      for (const v of graph.vertices) {
        xs.push(v.x);
        ys.push(v.y);
      }
    } else {
      for (const f of graph.faces) {
        xs.push(f.cx);
        ys.push(f.cy);
      }
    }
    this.xs = xs;
    this.ys = ys;
    this.numSites = xs.length;
    this.adj =
      kind === "Vertex" ? this.buildVertexAdj(graph) : this.buildCellAdj(graph);
  }

  public xOf(site: number): number {
    return this.xs[site] ?? Number.NaN;
  }
  public yOf(site: number): number {
    return this.ys[site] ?? Number.NaN;
  }

  /** Neighbour in a compass direction, or -1 if none. */
  public step(site: number, dir: string): number {
    return this.adj[site]?.byDir.get(dir) ?? -1;
  }

  /** The ray of sites reached by repeatedly stepping `dir` from `site`. */
  public ray(site: number, dir: string): number[] {
    const out: number[] = [];
    const seen = new Set<number>([site]);
    let cur = site;
    while (true) {
      const nxt = this.step(cur, dir);
      if (nxt < 0 || seen.has(nxt)) break;
      out.push(nxt);
      seen.add(nxt);
      cur = nxt;
    }
    return out;
  }

  /** Neighbour sites in a named direction group. */
  public group(site: number, name: string): number[] {
    const a = this.adj[site];
    if (!a) return [];
    if (name === "Orthogonal") return [...a.orthogonal];
    if (name === "Diagonal") return [...a.diagonal];
    // Adjacent / All / anything else → every neighbour.
    return [...a.orthogonal, ...a.diagonal];
  }

  /** All orthogonal neighbours (edge-sharing). */
  public neighbours(site: number): number[] {
    return [...(this.adj[site]?.orthogonal ?? [])];
  }

  // -- adjacency builders ---------------------------------------------------

  private finalize(
    orthoSets: number[][],
    diagSets: number[][],
  ): SiteAdj[] {
    const out: SiteAdj[] = [];
    for (let s = 0; s < this.numSites; s += 1) {
      const ortho = orthoSets[s] ?? [];
      const diag = diagSets[s] ?? [];
      const byDir = new Map<string, number>();
      // Orthogonal wins direction-name ties over diagonal; among same kind,
      // the nearer neighbour wins.
      const assign = (neigh: readonly number[]): void => {
        for (const t of neigh) {
          const dx = (this.xs[t] as number) - (this.xs[s] as number);
          const dy = (this.ys[t] as number) - (this.ys[s] as number);
          const dir = compassOf(dx, dy);
          const cur = byDir.get(dir);
          if (cur === undefined) {
            byDir.set(dir, t);
            continue;
          }
          const cdx = (this.xs[cur] as number) - (this.xs[s] as number);
          const cdy = (this.ys[cur] as number) - (this.ys[s] as number);
          if (dx * dx + dy * dy < cdx * cdx + cdy * cdy) byDir.set(dir, t);
        }
      };
      assign(ortho);
      assign(diag);
      out.push({ byDir, orthogonal: ortho, diagonal: diag });
    }
    return out;
  }

  private buildVertexAdj(graph: Graph): SiteAdj[] {
    const n = graph.vertices.length;
    const ortho: number[][] = Array.from({ length: n }, () => []);
    const diag: number[][] = Array.from({ length: n }, () => []);
    for (const e of graph.edges) {
      ortho[e.a]?.push(e.b);
      ortho[e.b]?.push(e.a);
    }
    // Diagonal vertex neighbours: opposite corners across a shared face.
    for (const f of graph.faces) {
      const vs = f.vertices;
      const k = vs.length;
      if (k < 4) continue; // triangles have no across-face diagonal
      for (let i = 0; i < k; i += 1) {
        const a = vs[i] as number;
        for (let j = i + 2; j < k; j += 1) {
          if (j === (i + k - 1) % k) continue; // skip the wrap-around edge
          const b = vs[j] as number;
          if (!graph.hasEdge(a, b)) {
            diag[a]?.push(b);
            diag[b]?.push(a);
          }
        }
      }
    }
    return this.finalize(dedupRows(ortho), dedupRows(diag));
  }

  private buildCellAdj(graph: Graph): SiteAdj[] {
    const faces = graph.faces;
    const n = faces.length;
    const ortho: number[][] = Array.from({ length: n }, () => []);
    const diag: number[][] = Array.from({ length: n }, () => []);

    // Edge-key → faces touching it (edge-sharing ⇒ orthogonal neighbours).
    const edgeFaces = new Map<string, number[]>();
    const vertFaces = new Map<number, number[]>();
    const ekey = (a: number, b: number): string =>
      a < b ? `${a}:${b}` : `${b}:${a}`;
    faces.forEach((f, fi) => {
      const vs = f.vertices;
      for (let i = 0; i < vs.length; i += 1) {
        const a = vs[i] as number;
        const b = vs[(i + 1) % vs.length] as number;
        const k = ekey(a, b);
        (edgeFaces.get(k) ?? edgeFaces.set(k, []).get(k)!).push(fi);
        (vertFaces.get(a) ?? vertFaces.set(a, []).get(a)!).push(fi);
      }
    });

    for (const fs of edgeFaces.values()) {
      for (let i = 0; i < fs.length; i += 1) {
        for (let j = i + 1; j < fs.length; j += 1) {
          ortho[fs[i] as number]?.push(fs[j] as number);
          ortho[fs[j] as number]?.push(fs[i] as number);
        }
      }
    }
    const isOrtho = (a: number, b: number): boolean =>
      (ortho[a] ?? []).includes(b);
    for (const fs of vertFaces.values()) {
      for (let i = 0; i < fs.length; i += 1) {
        for (let j = i + 1; j < fs.length; j += 1) {
          const a = fs[i] as number;
          const b = fs[j] as number;
          if (a !== b && !isOrtho(a, b)) {
            diag[a]?.push(b);
            diag[b]?.push(a);
          }
        }
      }
    }
    return this.finalize(dedupRows(ortho), dedupRows(diag));
  }
}

function dedupRows(rows: number[][]): number[][] {
  return rows.map((r) => [...new Set(r)]);
}

/** True if a face is a triangle (helper for callers). */
export const isTriangle = (f: GFace): boolean => f.vertices.length === 3;

export { ORTHO };
