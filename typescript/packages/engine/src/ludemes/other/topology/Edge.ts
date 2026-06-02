// @java Core/src/other/topology/Edge.java Edge
/**
 * Edge of the graph (equivalent to an edge of the board).
 *
 * Faithful 1:1 transliteration of other.topology.Edge.
 *
 * @author Eric.Piette and cambolbro  (Java original)
 */

import { TopologyElement, MutablePoint3D } from "./TopologyElement.js";
import type { SiteType, RelationType } from "./TopologyElement.js";
import type { Vertex } from "./Vertex.js";
import type { Cell }   from "./Cell.js";

/** Minimal Vector stand-in (for tangent fields). @java main.math.Vector */
export interface Vec2 { x: number; y: number; }

/**
 * Edge of the graph.
 * @java other.topology.Edge
 */
export class Edge extends TopologyElement {
  // -------- fields ---------------------------------------------------------

  /** Vertex end points [vA, vB]. */
  private readonly _vertices: [Vertex, Vertex];

  private readonly _cells:    Cell[]  = [];

  /** Adjacent edges (also used for orthogonal/neighbours). */
  private readonly _adjacent: Edge[]  = [];

  /** Edges that cross this edge (by index). */
  private _doesCross: Set<number> = new Set();

  private _tangentA: Vec2 | null = null;
  private _tangentB: Vec2 | null = null;

  // -------- constructors ---------------------------------------------------

  /**
   * @java Edge(Vertex v0, Vertex v1) — index defaults to -1
   */
  constructor(v0: Vertex, v1: Vertex);
  /**
   * @java Edge(int index, Vertex v0, Vertex v1)
   */
  constructor(index: number, v0: Vertex, v1: Vertex);

  constructor(
    indexOrV0: number | Vertex,
    v0OrV1: Vertex,
    v1OrUndef?: Vertex,
  ) {
    super();
    if (typeof indexOrV0 === "number") {
      // three-arg form
      this._index     = indexOrV0;
      this._vertices  = [v0OrV1, v1OrUndef!];
    } else {
      // two-arg form
      this._index    = -1;
      this._vertices = [indexOrV0, v0OrV1];
    }
    const vA = this._vertices[0];
    const vB = this._vertices[1];
    const x  = (vA.centroid3D().x() + vB.centroid3D().x()) / 2;
    const y  = (vA.centroid3D().y() + vB.centroid3D().y()) / 2;
    const z  = (vA.centroid3D().z() + vB.centroid3D().z()) / 2;
    this._centroid = new MutablePoint3D(x, y, z);
  }

  // -------- doesCross ------------------------------------------------------

  /** @java Edge#setDoesCross(BitSet) */
  setDoesCrossSet(doesCross: Set<number>): void { this._doesCross = doesCross; }

  /** @java Edge#setDoesCross(int) */
  setDoesCross(indexEdge: number): void { this._doesCross.add(indexEdge); }

  /** @java Edge#doesCross(int) */
  doesCross(edge: number): boolean {
    if (edge < 0) return false;
    return this._doesCross.has(edge);
  }

  // -------- vertex accessors -----------------------------------------------

  /** @java Edge#vertex(int) */
  vertex(which: 0 | 1): Vertex { return this._vertices[which]; }

  /** @java Edge#vA() */
  vA(): Vertex { return this._vertices[0]; }

  /** @java Edge#vB() */
  vB(): Vertex { return this._vertices[1]; }

  /** @java Edge#otherVertex(Vertex) */
  otherVertex(v: Vertex): Vertex | null {
    if (this._vertices[0] === v) return this._vertices[1];
    if (this._vertices[1] === v) return this._vertices[0];
    return null;
  }

  // -------- tangents -------------------------------------------------------

  /** @java Edge#tangentA() */
  tangentA(): Vec2 | null { return this._tangentA; }
  /** @java Edge#setTangentA(Vector) */
  setTangentA(vec: Vec2): void { this._tangentA = vec; }

  /** @java Edge#tangentB() */
  tangentB(): Vec2 | null { return this._tangentB; }
  /** @java Edge#setTangentB(Vector) */
  setTangentB(vec: Vec2): void { this._tangentB = vec; }

  /** @java Edge#isCurved() */
  isCurved(): boolean {
    return this._tangentA !== null && this._tangentB !== null;
  }

  // -------- directed arrows ------------------------------------------------

  /** @java Edge#toA() — always false */
  static toA(): boolean { return false; }

  /** @java Edge#toB() — always true */
  static toB(): boolean { return true; }

  // -------- type -----------------------------------------------------------

  /**
   * @java Edge#type() — determined by vertex relation
   */
  type(): RelationType {
    const va = this.vA();
    const vb = this.vB();
    if (va.orthogonal().includes(vb)) return "Orthogonal";
    if (va.diagonal().includes(vb))   return "Diagonal";
    return "OffDiagonal";
  }

  // -------- TopologyElement ------------------------------------------------

  /** @java Edge#elementType() */
  override elementType(): SiteType { return "Edge"; }

  override cells():    Cell[]   { return this._cells; }
  override vertices(): Vertex[] { return [this._vertices[0], this._vertices[1]]; }
  override edges():    Edge[]   { return [this]; }

  /** Edge label is its string index. @java Edge#label() */
  override label(): string { return String(this._index); }

  override orthogonal(): Edge[] { return this._adjacent; }
  override diagonal():   Edge[] { return []; }
  override off():        Edge[] { return []; }
  override adjacent():   Edge[] { return this._adjacent; }
  override neighbours(): Edge[] { return this._adjacent; }

  // -------- matches --------------------------------------------------------

  /**
   * @java Edge#containsVertex(int)
   */
  containsVertex(indexV: number): boolean {
    return indexV === this.vA().index() || this.vB().index() === indexV;
  }

  /**
   * Match by vertex identity.
   * @java Edge#matches(Vertex,Vertex)
   */
  matchesVertices(va: Vertex, vb: Vertex): boolean {
    return (
      (va.index() === this._vertices[0].index() && vb.index() === this._vertices[1].index()) ||
      (va.index() === this._vertices[1].index() && vb.index() === this._vertices[0].index())
    );
  }

  /**
   * Match by centroid positions.
   * @java Edge#matches(Point2D,Point2D)
   */
  matchesPoints(
    paX: number, paY: number,
    pbX: number, pbY: number,
  ): boolean {
    const vA = this._vertices[0];
    const vB = this._vertices[1];
    return (
      (paX === vA.centroid().x && paY === vA.centroid().y &&
       pbX === vB.centroid().x && pbY === vB.centroid().y) ||
      (paX === vB.centroid().x && paY === vB.centroid().y &&
       pbX === vA.centroid().x && pbY === vA.centroid().y)
    );
  }

  // -------- memory ---------------------------------------------------------

  /** @java Edge#optimiseMemory() — no-op in TS */
  optimiseMemory(): void { /* no-op */ }

  // -------- region lists ---------------------------------------------------

  override regionVertices(): Vertex[] { return this.vertices(); }
  override regionEdges():    Edge[]   { return this.edges(); }
  override regionCells():    Cell[]   { return []; }

  // -------- toString -------------------------------------------------------

  override toString(): string {
    return `Edge(${this._vertices[0].index()}-${this._vertices[1].index()})`;
  }
}
