// @java Core/src/other/topology/TopologyElement.java TopologyElement
/**
 * Common graph element extended by Vertex, Edge and Cell.
 *
 * Faithful 1:1 transliteration of other.topology.TopologyElement (abstract).
 *
 * @author Matthew.Stephenson and Eric.Piette  (Java original)
 */

// ----------- lightweight stand-ins for Java types we don't need at runtime --

/** Mirror of game.types.board.SiteType enum values used here. */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** Mirror of game.types.board.RelationType enum values used here. */
export type RelationType =
  | "Adjacent"
  | "Diagonal"
  | "All"
  | "OffDiagonal"
  | "Orthogonal";

/**
 * Minimal DirectionFacing marker — the real type lives in game.util.directions.
 * We use an opaque branded string to stay self-contained.
 */
export type DirectionFacing = string & { readonly __brand: "DirectionFacing" };

/** Minimal Point3D: {x, y, z}. */
export interface Point3D {
  x(): number;
  y(): number;
  z(): number;
}

/** Simple mutable point3D implementation. */
export class MutablePoint3D implements Point3D {
  constructor(
    private _x: number,
    private _y: number,
    private _z: number,
  ) {}
  x(): number { return this._x; }
  y(): number { return this._y; }
  z(): number { return this._z; }
}

/** Minimal Properties stand-in. */
export class Properties {
  private bits = 0n;
  get(bit: number): boolean { return (this.bits & (1n << BigInt(bit))) !== 0n; }
  set(bit: number): void    { this.bits |= 1n << BigInt(bit); }
}

/** [row, col, layer] coordinate. @java main.math.RCL */
class RCL {
  private _row    = 0;
  private _column = 0;
  private _layer  = 0;

  row():    number { return this._row; }
  column(): number { return this._column; }
  layer():  number { return this._layer; }

  setRow(r: number):    void { this._row    = r; }
  setColumn(c: number): void { this._column = c; }
  setLayer(l: number):  void { this._layer  = l; }

  set(row: number, col: number, layer: number): void {
    this._row = row; this._column = col; this._layer = layer;
  }
}

// ---------------------------------------------------------------------------

import type { Vertex } from "./Vertex.js";
import type { Edge }   from "./Edge.js";
import type { Cell }   from "./Cell.js";

/**
 * Abstract base for all graph topology elements (Vertex, Edge, Cell).
 * @java other.topology.TopologyElement
 */
export abstract class TopologyElement {
  // -------- fields ---------------------------------------------------------

  protected _index = 0;
  protected _centroid!: Point3D;
  private _coord = new RCL();
  protected _label = "?";
  private _cost  = 0;
  private _phase = 0;

  private readonly _supportedDirections:          DirectionFacing[] = [];
  private readonly _supportedOrthogonalDirections: DirectionFacing[] = [];
  private readonly _supportedDiagonalDirections:   DirectionFacing[] = [];
  private readonly _supportedAdjacentDirections:   DirectionFacing[] = [];
  private readonly _supportedOffDirections:        DirectionFacing[] = [];

  protected _properties: Properties = new Properties();

  private readonly _sitesAtDistance: TopologyElement[][] = [];

  protected _sortedOrthos: (TopologyElement | null)[] | null = null;

  // -------- abstract methods -----------------------------------------------

  abstract elementType(): SiteType;
  abstract vertices(): Vertex[];
  abstract edges():    Edge[];
  abstract cells():    Cell[];
  abstract regionVertices(): Vertex[];
  abstract regionEdges():    Edge[];
  abstract regionCells():    Cell[];

  abstract orthogonal(): TopologyElement[];
  abstract diagonal():   TopologyElement[];
  abstract off():        TopologyElement[];
  abstract neighbours(): TopologyElement[];
  abstract adjacent():   TopologyElement[];

  // -------- accessors ------------------------------------------------------

  /** @java TopologyElement#centroid() */
  centroid(): { x: number; y: number } {
    return { x: this._centroid.x(), y: this._centroid.y() };
  }

  /** @java TopologyElement#centroid3D() */
  centroid3D(): Point3D {
    return this._centroid;
  }

  /** @java TopologyElement#setCentroid(double,double,double) */
  setCentroid(cx: number, cy: number, cz: number): void {
    this._centroid = new MutablePoint3D(cx, cy, cz);
  }

  /** @java TopologyElement#index() */
  index(): number { return this._index; }

  /** @java TopologyElement#setIndex(int) */
  setIndex(idx: number): void { this._index = idx; }

  /** @java TopologyElement#phase() */
  phase(): number { return this._phase; }

  /** @java TopologyElement#setPhase(int) */
  setPhase(p: number): void { this._phase = p; }

  /** @java TopologyElement#label() */
  label(): string { return this._label; }

  /** @java TopologyElement#setLabel(String) */
  setLabel(lbl: string): void { this._label = lbl; }

  /** @java TopologyElement#row() */
  row():    number { return this._coord.row(); }
  /** @java TopologyElement#col() */
  col():    number { return this._coord.column(); }
  /** @java TopologyElement#layer() */
  layer():  number { return this._coord.layer(); }

  /** @java TopologyElement#setRow(int) */
  setRow(r: number):    void { this._coord.setRow(r); }
  /** @java TopologyElement#setColumn(int) */
  setColumn(c: number): void { this._coord.setColumn(c); }
  /** @java TopologyElement#setLayer(int) */
  setLayer(l: number):  void { this._coord.setLayer(l); }

  /** @java TopologyElement#setCoord(int,int,int) */
  setCoord(row: number, col: number, level: number): void {
    this._coord.set(row, col, level);
  }

  /** @java TopologyElement#cost() */
  cost(): number { return this._cost; }

  /** @java TopologyElement#setCost(int) */
  setCost(c: number): void { this._cost = c; }

  /** @java TopologyElement#properties() */
  properties(): Properties { return this._properties; }

  /** @java TopologyElement#setProperties(Properties) */
  setProperties(p: Properties): void { this._properties = p; }

  /** @java TopologyElement#setSortedOrthos(TopologyElement[]) */
  setSortedOrthos(orthos: (TopologyElement | null)[]): void {
    this._sortedOrthos = orthos;
  }

  /** @java TopologyElement#sortedOrthos() */
  sortedOrthos(): (TopologyElement | null)[] | null {
    return this._sortedOrthos;
  }

  /** @java TopologyElement#sitesAtDistance() */
  sitesAtDistance(): TopologyElement[][] {
    return this._sitesAtDistance;
  }

  /** @java TopologyElement#supportedDirections(RelationType) */
  supportedDirections(relationType?: RelationType): DirectionFacing[] {
    if (relationType === undefined) return this._supportedDirections;
    switch (relationType) {
      case "Adjacent":    return this._supportedAdjacentDirections;
      case "Diagonal":    return this._supportedDiagonalDirections;
      case "All":         return this._supportedDirections;
      case "OffDiagonal": return this._supportedOffDirections;
      case "Orthogonal":  return this._supportedOrthogonalDirections;
      default:            return this._supportedDirections;
    }
  }

  /** @java TopologyElement#supportedOrthogonalDirections() */
  supportedOrthogonalDirections(): DirectionFacing[] {
    return this._supportedOrthogonalDirections;
  }

  /** @java TopologyElement#supportedDiagonalDirections() */
  supportedDiagonalDirections(): DirectionFacing[] {
    return this._supportedDiagonalDirections;
  }

  /** @java TopologyElement#supportedAdjacentDirections() */
  supportedAdjacentDirections(): DirectionFacing[] {
    return this._supportedAdjacentDirections;
  }

  /** @java TopologyElement#supportedOffDirections() */
  supportedOffDirections(): DirectionFacing[] {
    return this._supportedOffDirections;
  }
}
