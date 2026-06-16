// @java Core/src/game/util/graph/GraphElement.java GraphElement
// @java Core/src/game/util/graph/Vertex.java Vertex
// @java Core/src/game/util/graph/Edge.java Edge
// @java Core/src/game/util/graph/Face.java Face
//
// The incidence substrate the trajectory generator walks. Our base Graph
// (graph.ts) stores only vertex/edge/face lists; Java's Vertex/Edge/Face carry
// the cross-references (vertex.edges()/faces(), edge's two faces, face.edges())
// that Face.stepsTo / Vertex.stepsTo traverse. This module derives those
// references once, so the generated topology matches Java element-for-element.

import { type Graph } from "../graph.js";

/** SiteType ordinals, faithful to Java game.types.board.SiteType. */
export enum SiteType {
  Vertex = 0,
  Edge = 1,
  Cell = 2,
}

export const NUM_SITE_TYPES = 3;

/** 3-D point; planar boards use z = 0. */
export interface Pt3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Common interface for a vertex, edge, or face acting as a graph element. */
export interface GElement {
  readonly id: number;
  readonly siteType: SiteType;
  readonly pt: Pt3;
  /** This element's pivot vertex (concentric boards), else null. */
  pivot(): VertexEl | null;
}

export class VertexEl implements GElement {
  public readonly siteType = SiteType.Vertex;
  public readonly edges: EdgeEl[] = [];
  public readonly faces: FaceEl[] = [];
  /** @java Vertex.cells() — the incident cells (faces). */
  public get cells(): FaceEl[] { return this.faces; }
  private pivotVertex: VertexEl | null = null;

  public constructor(
    public readonly id: number,
    public readonly pt: Pt3,
  ) {}

  public pivot(): VertexEl | null {
    return this.pivotVertex;
  }
  public setPivot(v: VertexEl | null): void {
    this.pivotVertex = v;
  }

  /** @java Vertex.edgeAwayFrom(Face) */
  public edgeAwayFrom(face: FaceEl): VertexEl | null {
    for (const edge of this.edges) {
      if (!face.containsEdge(edge)) return edge.otherVertex(this.id);
    }
    return null;
  }
}

export class EdgeEl implements GElement {
  public readonly siteType = SiteType.Edge;
  public readonly faces: FaceEl[] = [];
  /** @java Edge.cells() — the incident cells (faces) bordering this edge. */
  public get cells(): FaceEl[] { return this.faces; }

  public constructor(
    public readonly id: number,
    public readonly va: VertexEl,
    public readonly vb: VertexEl,
    public readonly pt: Pt3,
  ) {}

  public pivot(): VertexEl | null {
    return null;
  }

  /** @java Edge.otherVertex(int) */
  public otherVertex(vid: number): VertexEl {
    return this.va.id === vid ? this.vb : this.va;
  }

  /** @java Edge.otherFace(int) */
  public otherFace(faceId: number): FaceEl | null {
    for (const f of this.faces) if (f.id !== faceId) return f;
    return null;
  }
}

export class FaceEl implements GElement {
  public readonly siteType = SiteType.Cell;
  public readonly vertices: VertexEl[] = [];
  public readonly edges: EdgeEl[] = [];

  public constructor(
    public readonly id: number,
    public readonly pt: Pt3,
  ) {}

  /** @java Core/src/game/util/graph/Face.java pivot */
  public pivot(): VertexEl | null {
    // First vertex with a pivot (concentric boards).
    for (const v of this.vertices) {
      const p = v.pivot();
      if (p !== null) return p;
    }
    return null;
  }

  public containsVertex(v: VertexEl): boolean {
    for (const vv of this.vertices) if (vv.id === v.id) return true;
    return false;
  }
  public containsEdge(e: EdgeEl): boolean {
    for (const ee of this.edges) if (ee.id === e.id) return true;
    return false;
  }
}

/**
 * Derived topology: VertexEl / EdgeEl / FaceEl with their cross-references,
 * built once from a planar Graph. `elements(siteType)` mirrors Java
 * `graph.elements(SiteType)`.
 */
export class GraphTopology {
  public readonly verts: VertexEl[] = [];
  public readonly edgeEls: EdgeEl[] = [];
  public readonly faceEls: FaceEl[] = [];

  public constructor(graph: Graph) {
    // Vertices.
    for (const v of graph.vertices) {
      this.verts.push(new VertexEl(v.id, { x: v.x, y: v.y, z: v.z ?? 0 }));
    }

    // Pivots (circular/concentric basis): wire each ring vertex to its pivot
    // so Trajectories.setCircularDirections can derive In/Out/CW/CCW.
    for (const [vid, pivotId] of graph.pivots) {
      const v = this.verts[vid];
      const p = this.verts[pivotId];
      if (v && p) v.setPivot(p);
    }

    // Edges — midpoint as pt; record an undirected key → EdgeEl for face wiring.
    const edgeByKey = new Map<string, EdgeEl>();
    const key = (a: number, b: number): string =>
      a < b ? `${a}:${b}` : `${b}:${a}`;
    for (const e of graph.edges) {
      const va = this.verts[e.a];
      const vb = this.verts[e.b];
      if (!va || !vb) continue;
      const mid: Pt3 = {
        x: (va.pt.x + vb.pt.x) / 2,
        y: (va.pt.y + vb.pt.y) / 2,
        z: 0,
      };
      const edge = new EdgeEl(e.id, va, vb, mid);
      this.edgeEls.push(edge);
      edgeByKey.set(key(e.a, e.b), edge);
      va.edges.push(edge);
      vb.edges.push(edge);
    }

    // Faces — vertices in polygon order, edges between consecutive vertices.
    for (const f of graph.faces) {
      const face = new FaceEl(f.id, { x: f.cx, y: f.cy, z: 0 });
      for (const vid of f.vertices) {
        const v = this.verts[vid];
        if (v) {
          face.vertices.push(v);
          v.faces.push(face);
        }
      }
      const k = f.vertices.length;
      for (let i = 0; i < k; i += 1) {
        const a = f.vertices[i] as number;
        const b = f.vertices[(i + 1) % k] as number;
        const edge = edgeByKey.get(key(a, b));
        if (edge) {
          face.edges.push(edge);
          if (!edge.faces.includes(face)) edge.faces.push(face);
        }
      }
      this.faceEls.push(face);
    }
  }

  public elements(siteType: SiteType): GElement[] {
    if (siteType === SiteType.Vertex) return this.verts;
    if (siteType === SiteType.Edge) return this.edgeEls;
    return this.faceEls;
  }

  /** Mean edge length — @java Graph.averageEdgeLength(). */
  public averageEdgeLength(): number {
    if (this.edgeEls.length === 0) return 0;
    let total = 0;
    for (const e of this.edgeEls) {
      const dx = e.vb.pt.x - e.va.pt.x;
      const dy = e.vb.pt.y - e.va.pt.y;
      const dz = e.vb.pt.z - e.va.pt.z;
      total += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return total / this.edgeEls.length;
  }
}
