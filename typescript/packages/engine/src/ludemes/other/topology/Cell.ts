// @java Core/src/other/topology/Cell.java Cell
/**
 * Cell of the board (equivalent to a face of the graph).
 *
 * Faithful 1:1 transliteration of other.topology.Cell.
 *
 * @author Eric.Piette and Matthew.Stephenson  (Java original)
 */

import { TopologyElement, MutablePoint3D } from "./TopologyElement.js";
import type { SiteType } from "./TopologyElement.js";
import type { Vertex } from "./Vertex.js";
import type { Edge }   from "./Edge.js";

/**
 * Cell of the board (face of the graph).
 * @java other.topology.Cell
 */
export class Cell extends TopologyElement {
  // -------- fields ---------------------------------------------------------

  private _vertices:  Vertex[] = [];
  private readonly _edges:     Edge[]  = [];

  private _orthogonal: Cell[] = [];
  private _diagonal:   Cell[] = [];
  private _off:        Cell[] = [];
  private readonly _adjacent:  Cell[] = [];
  private readonly _neighbours: Cell[] = [];

  // -------- constructor ----------------------------------------------------

  /**
   * @java Cell(int index, double x, double y, double z)
   */
  constructor(idx: number, x: number, y: number, z: number) {
    super();
    this._index    = idx;
    this._label    = String(idx);
    this._centroid = new MutablePoint3D(x, y, z);
  }

  // -------- elementType ----------------------------------------------------

  /** @java Cell#elementType() */
  override elementType(): SiteType { return "Cell"; }

  // -------- adjacency accessors --------------------------------------------

  /** @java Cell#orthogonal() */
  override orthogonal(): Cell[] { return this._orthogonal; }

  /** @java Cell#setOrthogonal(List<Cell>) */
  setOrthogonal(c: Cell[]): void { this._orthogonal = c; }

  /** @java Cell#diagonal() */
  override diagonal(): Cell[] { return this._diagonal; }

  /** @java Cell#setDiagonal(List<Cell>) */
  setDiagonal(c: Cell[]): void { this._diagonal = c; }

  /** @java Cell#off() */
  override off(): Cell[] { return this._off; }

  /** @java Cell#setOff(List<Cell>) */
  setOff(c: Cell[]): void { this._off = c; }

  /** @java Cell#adjacent() */
  override adjacent(): Cell[] { return this._adjacent; }

  /** @java Cell#neighbours() */
  override neighbours(): Cell[] { return this._neighbours; }

  // -------- vertex/edge lists ----------------------------------------------

  /** @java Cell#vertices() */
  override vertices(): Vertex[] { return this._vertices; }

  /** @java Cell#setVertices(List<Vertex>) */
  setVertices(v: Vertex[]): void { this._vertices = v; }

  /** @java Cell#edges() */
  override edges(): Edge[] { return this._edges; }

  override cells(): Cell[] { return [this]; }

  // -------- coord helpers --------------------------------------------------

  /**
   * @java Cell#matchCoord(int,int)
   */
  matchCoord(x: number, y: number): boolean {
    return this.row() === x && this.col() === y;
  }

  /**
   * @java Cell#matches(double,double)
   */
  matchesXY(x: number, y: number): boolean {
    const dx = x - this.centroid().x;
    const dy = y - this.centroid().y;
    return Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001;
  }

  /**
   * @java Cell#matches(Cell)
   */
  matchesCell(other: Cell): boolean {
    const dx = other.centroid().x - this.centroid().x;
    const dy = other.centroid().y - this.centroid().y;
    return Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001;
  }

  // -------- equals/hashCode ------------------------------------------------

  equals(o: unknown): boolean {
    if (!(o instanceof Cell)) return false;
    return this._index === o._index;
  }

  hashCode(): number { return this._index; }

  // -------- memory ---------------------------------------------------------

  /** @java Cell#optimiseMemory() — no-op in TS */
  optimiseMemory(): void { /* no-op */ }

  // -------- region lists ---------------------------------------------------

  override regionVertices(): Vertex[] { return this.vertices(); }
  override regionEdges():    Edge[]   { return this.edges(); }
  override regionCells():    Cell[]   { return this.cells(); }

  // -------- toString -------------------------------------------------------

  override toString(): string { return `Cell: ${this._index}`; }
}
