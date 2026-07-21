// @java Core/src/other/topology/Vertex.java Vertex
/**
 * Vertex of the graph (equivalent to any intersection of a board).
 *
 * Faithful 1:1 transliteration of other.topology.Vertex.
 *
 * @author Eric.Piette  (Java original)
 */

import { TopologyElement, MutablePoint3D } from "./TopologyElement.js";
import type { SiteType } from "./TopologyElement.js";
import type { Edge } from "./Edge.js";
import type { Cell } from "./Cell.js";

/**
 * Vertex of the graph.
 * @java other.topology.Vertex
 */
export class Vertex extends TopologyElement {
  // -------- fields ---------------------------------------------------------

  private readonly _cells:      Cell[]   = [];
  private readonly _edges:      Edge[]   = [];
  private _pivot: Vertex | null = null;

  private readonly _orthogonal: Vertex[] = [];
  private readonly _diagonal:   Vertex[] = [];
  private readonly _off:        Vertex[] = [];
  private readonly _adjacent:   Vertex[] = [];
  private readonly _neighbours: Vertex[] = [];

  // -------- constructor ----------------------------------------------------

  /**
   * @java Vertex(int index, double x, double y, double z)
   */
  constructor(idx: number, x: number, y: number, z: number) {
    super();
    this._index    = idx;
    this._centroid = new MutablePoint3D(x, y, z);
  }

  // -------- elementType ----------------------------------------------------

  /** @java Vertex#elementType() */
  override elementType(): SiteType { return "Vertex"; }

  // -------- adjacency accessors --------------------------------------------

  /** @java Vertex#cells() */
  override cells(): Cell[]   { return this._cells; }

  /** @java Vertex#edges() */
  override edges(): Edge[]   { return this._edges; }

  /** @java Vertex#vertices() */
  override vertices(): Vertex[] { return [this]; }

  /** @java Vertex#pivot() */
  pivot(): Vertex | null { return this._pivot; }

  /** @java Vertex#setPivot(Vertex) */
  setPivot(v: Vertex): void { this._pivot = v; }

  // -------- neighbour lists ------------------------------------------------

  /** @java Vertex#orthogonal() */
  override orthogonal(): Vertex[] { return this._orthogonal; }

  /** @java Vertex#diagonal() */
  override diagonal(): Vertex[]   { return this._diagonal; }

  /** @java Vertex#off() */
  override off(): Vertex[]        { return this._off; }

  /** @java Vertex#adjacent() */
  override adjacent(): Vertex[]   { return this._adjacent; }

  /** @java Vertex#neighbours() */
  override neighbours(): Vertex[] { return this._neighbours; }

  /**
   * True if vertex vid is a neighbour (orthogonal or diagonal) of this vertex.
   * @java Vertex#neighbour(int)
   */
  neighbour(vid: number): boolean {
    for (const v of this._diagonal)   if (v.index() === vid) return true;
    for (const v of this._orthogonal) if (v.index() === vid) return true;
    return false;
  }

  /** @java Vertex#orthogonalOutDegree() */
  orthogonalOutDegree(): number { return this._orthogonal.length; }

  /** @java Vertex#optimiseMemory() — no-op in TS (GC handles this) */
  optimiseMemory(): void { /* no-op */ }

  // -------- region lists ---------------------------------------------------

  override regionVertices(): Vertex[] { return this.vertices(); }
  override regionEdges():    Edge[]   { return []; }
  override regionCells():    Cell[]   { return []; }

  // -------- toString -------------------------------------------------------

  override toString(): string { return `Vertex: ${this._index}`; }
}
